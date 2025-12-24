import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as speakeasy from "speakeasy";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { code, method } = await req.json();

    if (!code || code.length !== 6) {
      return NextResponse.json({ error: "Code invalide" }, { status: 400 });
    }

    const user = await prisma.users.findUnique({
      where: { email: session.user.email },
    });

    if (!user || !user.twoFASecret) {
      return NextResponse.json({ error: "Configuration introuvable" }, { status: 404 });
    }

    let isValid = false;

    if (method === "authenticator") {
      // Vérifier le code TOTP
      isValid = speakeasy.totp.verify({
        secret: user.twoFASecret,
        encoding: "base32",
        token: code,
        window: 2,
      });
    } else if (method === "email" || method === "sms") {
      // Vérifier le code simple
      isValid = user.twoFASecret === code;
    }

    if (!isValid) {
      return NextResponse.json({ error: "Code incorrect" }, { status: 400 });
    }

    // Activer le 2FA
    await prisma.users.update({
      where: { id: user.id },
      data: {
        twoFAEnabled: true,
        twoFAType: method,
        // Garder le secret pour authenticator, effacer pour email/sms
        twoFASecret: method === "authenticator" ? user.twoFASecret : null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "2FA activé avec succès",
    });
  } catch (error) {
    console.error("Erreur verify 2FA:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}