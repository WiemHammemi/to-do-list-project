"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function Setup2FAPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [qrCode, setQrCode] = useState<string>("");
  const [secret, setSecret] = useState<string>("");
  const [token, setToken] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"generate" | "verify">("generate");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const handleGenerateQR = async () => {
    setLoading(true);
    setError("");
    
    try {
      const response = await fetch("/api/2fa/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: session?.user?.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Erreur lors de la génération du QR code");
        return;
      }

      setQrCode(data.qrCode);
      setSecret(data.secret);
      setStep("verify");
    } catch (error) {
      setError("Erreur de connexion au serveur");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!token || token.length !== 6) {
      setError("Le code doit contenir 6 chiffres");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: session?.user?.id,
          token,
        }),
      }); 

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Code invalide");
        return;
      }

      setSuccess("2FA activé avec succès !");
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } catch (error) {
      setError("Erreur de connexion au serveur");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Configurer l'authentification à deux facteurs
          </h1>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm mb-4">
              {success}
            </div>
          )}

          {step === "generate" ? (
            <div className="text-center">
              <p className="text-gray-600 mb-6">
                L'authentification à deux facteurs ajoute une couche de sécurité supplémentaire à votre compte.
              </p>
              <button
                onClick={handleGenerateQR}
                disabled={loading}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition"
              >
                {loading ? "Génération..." : "Activer 2FA"}
              </button>
            </div>
          ) : (
            <div>
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-3">Étape 1 : Scanner le QR Code</h2>
                <p className="text-sm text-gray-600 mb-4">
                  Utilisez une application d'authentification comme Google Authenticator ou Authy pour scanner ce QR code.
                </p>
                {qrCode && (
                  <div className="flex justify-center">
                    <img src={qrCode} alt="QR Code" className="border rounded-lg p-4" />
                  </div>
                )}
              </div>

              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-3">Étape 2 : Clé secrète (optionnel)</h2>
                <p className="text-sm text-gray-600 mb-2">
                  Si vous ne pouvez pas scanner le QR code, entrez cette clé manuellement :
                </p>
                <div className="bg-gray-100 p-3 rounded font-mono text-sm break-all">
                  {secret}
                </div>
              </div>

              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-3">Étape 3 : Vérifier</h2>
                <p className="text-sm text-gray-600 mb-3">
                  Entrez le code à 6 chiffres généré par votre application :
                </p>
                <input
                  type="text"
                  value={token}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "");
                    if (value.length <= 6) {
                      setToken(value);
                    }
                  }}
                  maxLength={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-center text-2xl tracking-widest"
                  placeholder="000000"
                />
              </div>

              <button
                onClick={handleVerify}
                disabled={loading || token.length !== 6}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition"
              >
                {loading ? "Vérification..." : "Activer 2FA"}
              </button>

              <button
                onClick={() => {
                  setStep("generate");
                  setQrCode("");
                  setSecret("");
                  setToken("");
                  setError("");
                }}
                className="w-full mt-3 text-gray-600 py-2 text-sm hover:text-gray-800"
              >
                Annuler
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}