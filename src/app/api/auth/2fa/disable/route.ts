import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const user = await prisma.users.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    await prisma.users.update({
      where: { id: user.id },
      data: {
        twoFAEnabled: false,
        twoFAType: null,
        twoFASecret: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "2FA désactivé avec succès",
    });
  } catch (error) {
    console.error("Erreur disable 2FA:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}