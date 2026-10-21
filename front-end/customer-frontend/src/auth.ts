import { enrichCustomerSession } from '@/lib/authProfile';
import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Facebook from 'next-auth/providers/facebook';
import Credentials from 'next-auth/providers/credentials';
import { CredentialsSignin } from 'next-auth';
import { authClientHeaders } from '@/lib/authClient';

class ServiceUnavailable extends CredentialsSignin { code = 'service_unavailable'; }
class RateLimited extends CredentialsSignin { code = 'rate_limited'; }
class StaffOnly extends CredentialsSignin { code = 'staff_only'; }

const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:8081';

async function refreshAccessToken(request: string) {
  const res = await fetch(`${authServiceUrl}/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ request }),
  });

  if (!res.ok) return null;

  const data = await res.json();

  return {
    accessToken: data.new_access_token,
    refreshToken: request, // keep the same refresh token
    accessTokenExpires: Date.now() + 900000, // 15 min â€” adjust if your backend sends expires_in
  };
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Facebook({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
      // Use the app's Graph API version rather than the library's old v19 URL.
      authorization: {
        url: 'https://www.facebook.com/dialog/oauth',
        params: { scope: 'email,public_profile' },
      },
      checks: ['state'],
    }),
    Credentials({
      credentials: {
        mode: { type: 'text' },
        phone: { type: 'text' },
        code: { type: 'text' },
        challengeId: { type: 'text' },
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      authorize: async (credentials) => {
        const mobile = credentials?.mode === 'mobile';
        if (mobile ? (!credentials?.phone || !credentials?.code || !credentials?.challengeId) : (!credentials?.email || !credentials?.password)) return null;

        const res = await fetch(`${authServiceUrl}/auth/${mobile ? 'customer/otp/verify' : 'login'}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...await authClientHeaders(),
          },
          cache: 'no-store',
          signal: AbortSignal.timeout(10000),
          body: JSON.stringify(mobile ? {
            phone: credentials.phone, code: credentials.code, challengeId: credentials.challengeId,
          } : { email: credentials.email, password: credentials.password }),
        }).catch(() => { throw new ServiceUnavailable(); });

        if (res.status >= 500) throw new ServiceUnavailable();
        if (res.status === 429) throw new RateLimited();
        if (res.status === 403) throw new StaffOnly();
        if (!res.ok) return null;

        const data = await res.json();

        return {
          id: data.user_id,
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          accessTokenExpires: Date.now() + data.expires_in,
        };
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== 'google' && account?.provider !== 'facebook') return true;
      try {
        const google = account.provider === 'google';
        const credential = google ? account.id_token : account.access_token;
        if (!credential) return false;
        const res = await fetch(`${authServiceUrl}/auth/oauth/${account.provider}`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          cache: 'no-store', signal: AbortSignal.timeout(10000),
          body: JSON.stringify(google ? { id_token: credential } : { access_token: credential }),
        });
        if (!res.ok) {
          const error = res.status >= 500 ? 'ServiceUnavailable'
            : res.status === 409 ? 'OAuthAccountExists'
            : res.status === 403 ? 'StaffOnly'
            : res.status === 400 && !google ? 'FacebookEmailRequired'
            : 'OAuthSignInFailed';
          return `/login?error=${error}`;
        }
        const data = await res.json();
        if (!data.user_id || !data.access_token || !data.refresh_token) return false;
        user.id = data.user_id;
        user.accessToken = data.access_token;
        user.refreshToken = data.refresh_token;
        user.accessTokenExpires = Date.now() + (Number(data.expires_in) || 900000);
        return true;
      } catch { return '/login?error=ServiceUnavailable'; }
    },
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
        token.accessTokenExpires = user.accessTokenExpires;
        token.sub = user.id;
        delete token.error;
        return enrichCustomerSession(token, authServiceUrl);
      }
      if (Date.now() < (token.accessTokenExpires as number)) {
        return enrichCustomerSession(token, authServiceUrl);
      }

      const refreshed = token.refreshToken ? await refreshAccessToken(token.refreshToken).catch(() => null) : null;

      if (!refreshed) {
        return {
          ...token,
          accessToken: undefined,
          error: 'RefreshTokenExpired',
        };
      }

      return enrichCustomerSession({
        ...token,
        accessToken: refreshed.accessToken,
        refreshToken: refreshed.refreshToken,
        accessTokenExpires: refreshed.accessTokenExpires,
      }, authServiceUrl);
    },

    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      session.error = token.error as string | undefined;
      if (token.sub) session.user.id = token.sub;
      session.user.name = token.name ?? null;
      session.user.email = token.email ?? '';
      return session;
    },
  },

  events: {
    async signOut(message) {
      if ('token' in message && message.token?.refreshToken) {
        await fetch(`${authServiceUrl}/auth/logout`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ request: message.token.refreshToken }),
          cache: 'no-store', signal: AbortSignal.timeout(5000),
        }).catch(() => undefined);
      }
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.AUTH_SECRET,
});
