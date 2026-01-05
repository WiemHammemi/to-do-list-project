import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;


  try {
    const task = await prisma.task.findFirst({
      where: {
        id: Number(id),
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