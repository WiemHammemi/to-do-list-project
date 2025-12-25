import { useSession } from "next-auth/react";

export default function ProfileSection() {
      const { data: session, status } = useSession();
    
  return (
 
   <div className="bg-white rounded-lg shadow-lg p-6 mb-6">  
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Informations du profil</h2>
          <div className="space-y-4">
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                  <p className="text-gray-900">{session?.user?.name || "Non défini"}</p>
              </div>
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <p className="text-gray-900">{session?.user?.email}</p>
              </div>
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Numéro de téléphone</label>
                  <p className="text-gray-900">{session?.user?.phoneNumber}</p>
              </div>
          </div>
      </div>
    );  
}