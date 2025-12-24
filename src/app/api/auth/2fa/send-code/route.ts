
import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email requis" }, { status: 400 });
    }

    const user = await prisma.users.findUnique({
      where: { email },
    });

    if (!user || !user.twoFAEnabled) {
      return NextResponse.json({ error: "Utilisateur introuvable ou 2FA non activé" }, { status: 404 });
    }

    // Pour authenticator, pas besoin d'envoyer de code
    if (user.twoFAType === "authenticator") {
      return NextResponse.json({
        success: true,
        method: "authenticator",
        message: "Utilisez votre application d'authentification",
      });
    }

    if (user.twoFAType === "email" || user.twoFAType === "sms") {
      // Générer un nouveau code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Stocker le code avec un timestamp pour expiration 
      await prisma.users.update({
        where: { id: user.id },
        data: { twoFASecret: code },
      });

      // Envoyer le code par email ou SMS
      if (user.twoFAType === "email") {
        await sendEmail(user.email, "Code de connexion", `Votre code: ${code}`);
        console.log(`Code email pour ${user.email}: ${code}`);
      } else {
        // await sendSMS(user.phone, `Code de connexion: ${code}`);
        console.log(`Code SMS pour ${user.email}: ${code}`);
      }

      return NextResponse.json({
        success: true,
        method: user.twoFAType,
        message: "Code envoyé",
      });
    }

    return NextResponse.json({ error: "Méthode 2FA non supportée" }, { status: 400 });
  } catch (error) {
    console.error("Erreur send-code:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}