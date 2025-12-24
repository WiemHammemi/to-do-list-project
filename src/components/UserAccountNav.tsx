"use client";

import { signOut } from "next-auth/react";

export default function UserAccountNav() {
  const handleSignOut = async () => {
    await signOut({
      callbackUrl: "/login",
      redirect: true,
    });
  };

  return (
    <button
      onClick={handleSignOut}
      className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition"
    >
      Se déconnecter
    </button>
  );
}