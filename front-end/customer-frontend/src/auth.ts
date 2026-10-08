import { enrichCustomerSession } from '@/lib/authProfile';
import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Facebook from 'next-auth/providers/facebook';
import Credentials from 'next-auth/providers/credentials';

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
          },
          cache: 'no-store',
          signal: AbortSignal.timeout(10000),
          body: JSON.stringify(mobile ? {
            phone: credentials.phone, code: credentials.code, challengeId: credentials.challengeId,
          } : { email: credentials.email, password: credentials.password }),
        });

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
    async jwt({ token, user, account }) {
      if (account?.provider == 'credentials' && user) {
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
        token.accessTokenExpires = user.accessTokenExpires;
        token.sub = user.id;
        return enrichCustomerSession(token, authServiceUrl);
      }

      // google
      if (account?.provider == 'google') {
        const res = await fetch(`${authServiceUrl}/auth/oauth/google`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id_token: account.id_token,
            role: 'CUSTOMER',
          }),
        });

        if (!res.ok)
          return {
            ...token,
            error: 'GoogleOAuthFailed',
          };

        const data = await res.json();

        token.accessToken = data.access_token;
        token.refreshToken = data.refresh_token;
        token.accessTokenExpires = Date.now() + 900000;
        return token;
      }

      // facebook
      if (account?.provider == 'facebook') {
        const res = await fetch(`${authServiceUrl}/auth/oauth/facebook`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            access_token: account.id_token,
            role: 'CUSTOMER',
          }),
        });

        if (!res.ok)
          return {
            ...token,
            error: 'FacebookOAuthFailed',
          };

        const data = await res.json();
        token.accessToken = data.access_token;
        token.refreshToken = data.refresh_token;
        token.accessTokenExpires = Date.now() + 900000;
        return token;
      }

      if (Date.now() < (token.accessTokenExpires as number)) {
        return enrichCustomerSession(token, authServiceUrl);
      }

      const refreshed = await refreshAccessToken(token.refreshToken as string);

      if (!refreshed) {
        return {
          ...token,
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

  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXT_PUBLIC_AUTH_SECRET,
});
