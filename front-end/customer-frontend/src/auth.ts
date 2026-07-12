import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Facebook from 'next-auth/providers/facebook';
import Credentials from 'next-auth/providers/credentials';

async function refreshAccessToken(request: string) {
  const res = await fetch('http://localhost:8081/auth/refresh', {
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
    accessTokenExpires: Date.now() + 900000, // 15 min — adjust if your backend sends expires_in
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
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) return null;

        const res = await fetch('http://localhost:8081/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: credentials.email,
            password: credentials.password,
          }),
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
        return token;
      }

      // google
      if (account?.provider == 'google') {
        const res = await fetch('http://localhost:8081/auth/oauth/google', {
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
        const res = await fetch('http://localhost:8081/auth/oauth/facebook', {
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
        return token;
      }

      const refreshed = await refreshAccessToken(token.refreshToken as string);

      if (!refreshed) {
        return {
          ...token,
          error: 'RefreshTokenExpired',
        };
      }

      return {
        ...token,
        accessToken: refreshed.accessToken,
        refreshToken: refreshed.refreshToken,
        accessTokenExpires: refreshed.accessTokenExpires,
      };
    },

    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      session.error = token.error as string | undefined;
      if (token.sub) session.user.id = token.sub;
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
