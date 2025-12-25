"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [show2FA, setShow2FA] = useState(false);
  const [twoFACode, setTwoFACode] = useState("");
  const [tempCredentials, setTempCredentials] = useState({ email: "", password: "" });
  const [resendLoading, setResendLoading] = useState(false);
  const [twoFAMethod, setTwoFAMethod] = useState("");

  useEffect(() => {
    if (searchParams.get("registered") === "true") {
      setSuccess("Inscription réussie ! Vous pouvez maintenant vous connecter.");
    }
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.email || !formData.password) {
      setError("Tous les champs sont requis");
      return;
    }

    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        if (result.error === "2FA_REQUIRED") {
          // Envoyer automatiquement le code pour email/SMS
          try {
            const sendCodeResponse = await fetch("/api/auth/2fa/send-code", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email: formData.email }),
            });

            if (sendCodeResponse.ok) {
              const data = await sendCodeResponse.json();
              // Afficher le formulaire 2FA
              setTempCredentials({ email: formData.email, password: formData.password });
              setShow2FA(true);
              setTwoFAMethod(data.method);
              setError("");
              // Afficher un message si c'est email/SMS
              if (data.method === "email") {
                setSuccess("Un code de vérification a été envoyé à votre email");
              } else if (data.method === "sms") {
                setSuccess("Un code de vérification a été envoyé par SMS");
              }
            } else {
              // Si l'envoi échoue, on affiche quand même le formulaire (pour authenticator)
              setTempCredentials({ email: formData.email, password: formData.password });
              setShow2FA(true);
              setError("");
            }
          } catch (sendError) {
            // En cas d'erreur, on affiche quand même le formulaire 2FA
            setTempCredentials({ email: formData.email, password: formData.password });
            setShow2FA(true);
            setError("");
          }
        } else {
          setError("Email ou mot de passe incorrect");
        }
        return;
      }

      if (result?.ok) {
        router.push("/dashboard");
      }
    } catch (error) {
      setError("Erreur de connexion au serveur");
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setResendLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/auth/2fa/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: tempCredentials.email }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.method === "email") {
          setSuccess("Un nouveau code a été envoyé à votre email");
        } else if (data.method === "sms") {
          setSuccess("Un nouveau code a été envoyé par SMS");
        }
      } else {
        setError("Impossible de renvoyer le code");
      }
    } catch (err) {
      setError("Erreur lors de l'envoi du code");
    } finally {
      setResendLoading(false);
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!twoFACode || twoFACode.length !== 6) {
      setError("Veuillez entrer un code à 6 chiffres");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/2fa/login-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: tempCredentials.email,
          password: tempCredentials.password,
          code: twoFACode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Code incorrect");
      }

      // Connexion réussie, rediriger
      const result = await signIn("credentials", {
        email: tempCredentials.email,
        password: tempCredentials.password,
        redirect: false,
        skipTwoFA: "true",
      });

      if (result?.ok) {
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "Erreur lors de la vérification");
    } finally {
      setLoading(false);
    }
  };

  if (show2FA) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Vérification 2FA</h1>
            <p className="text-gray-600 mt-2">
              Entrez le code d'authentification à deux facteurs
            </p>
          </div>

          <form onSubmit={handleVerify2FA} className="space-y-6">
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                {success}
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="twoFACode" className="block text-sm font-medium text-gray-700 mb-2">
                Code de vérification
              </label>
              <input
                type="text"
                id="twoFACode"
                name="twoFACode"
                maxLength={6}
                value={twoFACode}
                onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, ""))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition text-center text-2xl tracking-widest"
                placeholder="000000"
                disabled={loading}
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={loading || twoFACode.length !== 6}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? "Vérification..." : "Vérifier"}
            </button>

            {/* Bouton pour renvoyer le code (seulement pour email/SMS) */}
            {twoFAMethod !== "authenticator" && (
              <button
                type="button"
                onClick={handleResendCode}
                disabled={resendLoading}
                className="w-full text-indigo-600 hover:text-indigo-700 font-medium disabled:opacity-50"
              >
                {resendLoading ? "Envoi en cours..." : "Renvoyer le code"}
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setShow2FA(false);
                setTwoFACode("");
                setError("");
                setSuccess("");
              }}
              className="w-full text-gray-600 hover:text-gray-800 font-medium"
            >
              Retour
            </button>
          </form>
        </div>
      </div>
    ); 
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Connexion</h1>
          <p className="text-gray-600 mt-2">Accédez à votre compte</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
              {success}
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
              placeholder="jean@example.com"
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Mot de passe
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
              placeholder="••••••••"
              disabled={loading}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember"
                type="checkbox"
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="remember" className="ml-2 block text-sm text-gray-700">
                Se souvenir de moi
              </label>
            </div>
            <Link href="/forgot-password" className="text-sm text-indigo-600 hover:text-indigo-500">
              Mot de passe oublié ?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? "Connexion en cours..." : "Se connecter"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Vous n'avez pas de compte ?{" "}
            <Link href="/register" className="text-indigo-600 font-medium hover:text-indigo-500">
              S'inscrire
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}