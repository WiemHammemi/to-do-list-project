"use client";

import { useEffect, useState } from "react";
import { User, Settings, LogOut, ChevronDown, Home } from "lucide-react";
import { signOut } from "next-auth/react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function UserAccountNav() {
  const {data: session, status} = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const handleSignOut = async () => {
    console.log("Déconnexion...");
    await signOut({ callbackUrl: "/login", redirect: true });
  };

  useEffect(() => {
    if(status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  return (
    <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
    <div className="flex w-full items-center justify-between">

      <button
        onClick={() => router.push("/dashboard")}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-all duration-200 font-medium"
      >
        <Home size={18} />
        <span>Dashboard</span>
      </button>

      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all duration-200"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
            <User size={18} />
          </div>
          <span className="font-medium text-gray-700">Mon compte</span>
          <ChevronDown 
            size={18} 
            className={`text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setIsOpen(false)}
            />
            
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-20 animate-in fade-in slide-in-from-top-2 duration-200">

              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-900">{session?.user?.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{session?.user?.email}</p>
              </div>  

              <div className="py-2">
                <button
                  onClick={() => router.push("/settings")}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                >
                  <Settings size={18} />
                  <span>Paramètres</span>
                </button>

                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={18} />
                  <span>Se déconnecter</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
    </div>
    </div>
    </nav>
  );
}