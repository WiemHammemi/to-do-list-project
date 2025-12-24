import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { sendSMS } from "@/lib/sms";
import * as speakeasy from "speakeasy";
import * as QRCode from "qrcode";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
   

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { method } = await req.json();

    if (!["authenticator", "email", "sms"].includes(method)) {
      return NextResponse.json({ error: "Méthode invalide" }, { status: 400 });
    }

    const user = await prisma.users.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    if (method === "authenticator") {
      // Générer un secret pour Google Authenticator
      const secret = speakeasy.generateSecret({
        name: `Next App (${user.email})`,
        issuer: "NextApp",
      });

      // Stocker temporairement le secret (vous pouvez utiliser Redis ou une table temporaire)
      await prisma.users.update({
        where: { id: user.id },
        data: { twoFASecret: secret.base32 },
      });

      // Générer le QR code
      const qrCode = await QRCode.toDataURL(secret.otpauth_url || "");

      return NextResponse.json({
        success: true,
        qrCode,
        secret: secret.base32,
      });
    } else if (method === "email") {
      // Générer un code à 6 chiffres
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Stocker le code temporairement (avec expiration de 10 minutes)
      await prisma.users.update({
        where: { id: user.id },
        data: { twoFASecret: code },
      });

      // Envoyer l'email (à implémenter avec nodemailer ou un service d'email)
      await sendEmail(user.email, "Code de vérification", `Votre code est: ${code}`);

      console.log(`Code email pour ${user.email}: ${code}`);

      return NextResponse.json({
        success: true,
        message: "Code envoyé par email",
      });
    } else if (method === "sms") {
      if (!user.phoneNumber) {
        return NextResponse.json(
          { error: "Aucun numéro de téléphone enregistré. Veuillez ajouter un numéro dans votre profil." },
          { status: 400 }
        );
      }

      // Générer un code à 6 chiffres
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Stocker le code temporairement
      await prisma.users.update({
        where: { id: user.id },
        data: { twoFASecret: code },
      });

      await sendSMS(user.phoneNumber, `Votre code de vérification: ${code}`);

      console.log(`Code SMS pour ${user.name}: ${code}`);

      return NextResponse.json({
        success: true,
        message: "Code envoyé par SMS",
      });
    }

    return NextResponse.json({ error: "Méthode non implémentée" }, { status: 400 });
  } catch (error) {
    console.error("Erreur setup 2FA:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}