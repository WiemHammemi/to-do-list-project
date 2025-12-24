// app/dashboard/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import UserAccountNav from "@/components/UserAccountNav";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <UserAccountNav />
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">
            Bienvenue, {session.user?.name || "Utilisateur"} !
          </h2>
          <p className="text-gray-600">Email : {session.user?.email}</p>

          <div className="mt-8">
            <h3 className="text-lg font-medium mb-4">Vos informations</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-medium">Nom:</span>
                <span>{session.user?.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Email:</span>
                <span>{session.user?.email}</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}