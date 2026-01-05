import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const task = await prisma.task.findFirst({
      where: {
        id: Number(id),
        user_id: Number(session.user.id)
      }
    });

    if (!task) {
      return NextResponse.json({ success: "Tâche non trouvée" }, { status: 200 });
    }

    const history = await prisma.taskHistory.findMany({
      where: { task_id: Number(id) },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    return NextResponse.json({ data: history }, { status: 200 });
  } catch (error) {
    console.error('Erreur récupération historique:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}