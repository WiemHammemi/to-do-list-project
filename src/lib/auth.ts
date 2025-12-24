import { PrismaAdapter } from "@auth/prisma-adapter";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import { compare } from "bcryptjs";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },

  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
  if (!credentials?.email || !credentials?.password) {
    return null;
  }

  const user = await prisma.users.findUnique({
    where: { email: credentials.email },
  });

  if (!user) {
    return null;
  }

  const passwordMatch = await compare(credentials.password, user.password);
  if (!passwordMatch) {
    return null;
  }

  // Vérifier si on doit bypasser le 2FA (après vérification réussie)
  const skipTwoFA = (credentials as any).skipTwoFA === "true";
  
  if (user.twoFAEnabled && !skipTwoFA) {
    throw new Error("2FA_REQUIRED");
  }

  return {
    id: String(user.id),
    name: user.name,
    email: user.email,
  };
}
    }),
  ],
  
};