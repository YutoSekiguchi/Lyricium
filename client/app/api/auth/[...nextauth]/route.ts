import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import type { NextAuthOptions } from "next-auth";

type ClientType = {
  clientId: string;
  clientSecret: string;
};

const options: NextAuthOptions = {
	providers: [
		GoogleProvider({
			clientId: process.env.GOOGLE_CLIENT_ID,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET,
		} as ClientType),
	],
	secret: process.env.NEXTAUTH_SECRET,
	callbacks: {
    async signIn(params) {
			console.log('signIn', params);
			return Promise.resolve(true);
		}
	}
}

const handler = NextAuth(options);
export { handler as GET, handler as POST };
