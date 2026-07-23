import 'next-auth';

declare module 'next-auth' {
  interface User {
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpires?: number;
  }

  interface Session {
    accessToken?: string;
    error?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpires?: string;
  }
}
