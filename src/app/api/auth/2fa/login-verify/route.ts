import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { compare } from "bcryptjs";
import * as speakeasy from "speakeasy";

export async function POST(req: NextRequest) {
  try {
    const { email, password, code } = await req.json();

    if (!email || !password || !code) {
      return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
    }

    // Vérifier l'utilisateur
    const user = await prisma.users.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    // Vérifier le mot de passe
    const passwordMatch = await compare(password, user.password);
    if (!passwordMatch) {
      return NextResponse.json({ error: "Identifiants incorrects" }, { status: 401 });
    }

    // Vérifier que le 2FA est activé
    if (!user.twoFAEnabled || !user.twoFAType) {
      return NextResponse.json({ error: "2FA non activé" }, { status: 400 });
    }

    let isValid = false;

    if (user.twoFAType === "authenticator" && user.twoFASecret) {
      // Vérifier le code TOTP
      isValid = speakeasy.totp.verify({
        secret: user.twoFASecret,
        encoding: "base32",
        token: code,
        window: 2,
      });
    } else if ((user.twoFAType === "email" || user.twoFAType === "sms") && user.twoFASecret) {

      isValid = user.twoFASecret === code;
      
      // Nettoyer le code après vérification réussie
      if (isValid) {
        await prisma.users.update({
          where: { id: user.id },
          data: {
             twoFASecret: null ,  
             twoFAVerifiedAt: new Date(),
            },
        });
      }
    }

    if (!isValid) {
      return NextResponse.json({ error: "Code incorrect" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "Code vérifié avec succès",
    });
  } catch (error) {
    console.error("Erreur login-verify 2FA:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

