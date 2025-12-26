
import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: Int;
      name?: string | null;
      email?: string | null;
      phoneNumber?: string | null; 
    };
  }

  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    phoneNumber?: string | null; 
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    name?: string | null;
    email?: string | null;
    phoneNumber?: string | null; 
  }
}