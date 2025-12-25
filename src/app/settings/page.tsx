"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Shield, Mail, Smartphone, Key, CheckCircle, XCircle, User } from "lucide-react";
import UserAccountNav from "@/components/UserAccountNav";

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(""); 
  const [error, setError] = useState("");
  
  const [twoFASettings, setTwoFASettings] = useState({
    enabled: false,
    type: "", // "authenticator", "email", "sms"
  });

  const [qrCode, setQrCode] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [showSetup, setShowSetup] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    fetchTwoFAStatus();
  }, []);

  const fetchTwoFAStatus = async () => {
    try {
      const response = await fetch("/api/auth/2fa/status");
      const data = await response.json();
      if (data.success) {
        setTwoFASettings({
          enabled: data.twoFAEnabled,
          type: data.twoFAType || "",
        });
      }
    } catch (err) {
      console.error("Erreur lors de la récupération du statut 2FA:", err);
    }
  };

  const handleEnable2FA = async (method: string) => {
    setLoading(true);
    setError("");
    setSuccess("");
    setSelectedMethod(method);

    try {
      const response = await fetch("/api/auth/2fa/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la configuration");
      }

      if (method === "authenticator" && data.qrCode) {
        setQrCode(data.qrCode);
        setShowSetup(true);
      } else if (method === "email" || method === "sms") {
        setSuccess(`Un code de vérification a été envoyé à votre ${method === "email" ? "email" : "numéro de téléphone"}`);
        setShowSetup(true);
      }
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'activation du 2FA");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError("Veuillez entrer un code à 6 chiffres");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: verificationCode,
          method: selectedMethod,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Code de vérification incorrect");
      }

      setSuccess("Authentification à deux facteurs activée avec succès !");
      setShowSetup(false);
      setQrCode("");
      setVerificationCode("");
      fetchTwoFAStatus();
    } catch (err: any) {
      setError(err.message || "Erreur lors de la vérification");
    } finally {
      setLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!confirm("Êtes-vous sûr de vouloir désactiver l'authentification à deux facteurs ?")) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/2fa/disable", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la désactivation");
      }

      setSuccess("Authentification à deux facteurs désactivée");
      fetchTwoFAStatus();
    } catch (err: any) {
      setError(err.message || "Erreur lors de la désactivation");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Chargement...</div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <UserAccountNav />
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Messages */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            {success}
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <XCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {/* Section Sécurité */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-6 h-6 text-indigo-600" />
            <h2 className="text-2xl font-bold text-gray-900">Sécurité</h2>
          </div>

          {/* Statut 2FA */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">
                  Authentification à deux facteurs (2FA)
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {twoFASettings.enabled
                    ? `Activée via ${
                        twoFASettings.type === "authenticator"
                          ? "Google Authenticator"
                          : twoFASettings.type === "email"
                          ? "Email"
                          : "SMS"
                      }`
                    : "Désactivée"}
                </p>
              </div>
              <div
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  twoFASettings.enabled
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {twoFASettings.enabled ? "Activée" : "Désactivée"}
              </div>
            </div>
          </div>

          {/* Configuration 2FA */}
          {!showSetup && !twoFASettings.enabled && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Choisissez une méthode d'authentification
              </h3>

              {/* Google Authenticator */}
              <div className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition cursor-pointer">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-indigo-50 rounded-lg">
                    <Key className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">
                      Google Authenticator
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Utilisez une application d'authentification comme Google
                      Authenticator ou Authy
                    </p>
                    <button
                      onClick={() => handleEnable2FA("authenticator")}
                      disabled={loading}
                      className="mt-3 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm font-medium transition"
                    >
                      {loading && selectedMethod === "authenticator"
                        ? "Configuration..."
                        : "Configurer"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Email */}
              <div className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition cursor-pointer">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Mail className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">Email</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Recevez un code de vérification par email
                    </p>
                    <button
                      onClick={() => handleEnable2FA("email")}
                      disabled={loading}
                      className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium transition"
                    >
                      {loading && selectedMethod === "email"
                        ? "Configuration..."
                        : "Configurer"}
                    </button>
                  </div>
                </div>
              </div>

              {/* SMS */}
              <div className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition cursor-pointer">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-green-50 rounded-lg">
                    <Smartphone className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">SMS</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Recevez un code de vérification par SMS
                    </p>
                    <button
                      onClick={() => handleEnable2FA("sms")}
                      disabled={loading}
                      className="mt-3 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-medium transition"
                    >
                      {loading && selectedMethod === "sms"
                        ? "Configuration..."
                        : "Configurer"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Setup 2FA */}
          {showSetup && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Configuration de l'authentification
              </h3>

              {selectedMethod === "authenticator" && qrCode && (
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-4">
                    Scannez ce QR code avec votre application d'authentification
                  </p>
                  <div className="inline-block p-4 bg-white border-2 border-gray-200 rounded-lg">
                    <img src={qrCode} alt="QR Code" className="w-64 h-64" />
                  </div>
                </div>
              )}

              {(selectedMethod === "email" || selectedMethod === "sms") && (
                <p className="text-sm text-gray-600 text-center p-4 bg-blue-50 rounded-lg">
                  Un code de vérification a été envoyé à votre{" "}
                  {selectedMethod === "email" ? "adresse email" : "numéro de téléphone"}
                </p>
              )}

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Code de vérification
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-center text-2xl tracking-widest"
                  placeholder="000000"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleVerify2FA}
                  disabled={loading || verificationCode.length !== 6}
                  className="flex-1 bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {loading ? "Vérification..." : "Vérifier et activer"}
                </button>
                <button
                  onClick={() => {
                    setShowSetup(false);
                    setQrCode("");
                    setVerificationCode("");
                    setError("");
                  }}
                  className="px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}

          {/* Désactiver 2FA */}
          {twoFASettings.enabled && (
            <div className="mt-6">
              <button
                onClick={handleDisable2FA}
                disabled={loading}
                className="w-full bg-red-600 text-white py-3 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 transition"
              >
                {loading ? "Désactivation..." : "Désactiver l'authentification à deux facteurs"}
              </button>
            </div>
          )}
        </div>
 
        {/* Section Profil */}
        <div className="bg-white rounded-lg shadow-lg p-6">
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
      </main>
    </div> 
  );
}