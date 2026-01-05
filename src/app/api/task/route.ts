import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createTaskHistory } from "@/lib/taskHistory";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/dist/server/web/spec-extension/response";


export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return new Response(JSON.stringify({ error: "Non autorisé" }), { status: 401 });
    }

    const tasks = await prisma.task.findMany({
        // where: { user_id: Number(session.user.id) },
        orderBy: { created_at: "desc" },
    });

    return new Response(JSON.stringify(tasks), { status: 200 });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const body = await request.json();

  const newTask = await prisma.task.create({
    data: {
      title: body.title,
      description: body.description,
      status: body.status,
      priority: body.priority,
      due_date: new Date(body.due_date),
      user_id: Number(session.user.id),
    },
  });

  // Enregistrer la création dans l'historique
  const userName = session.user.name || 'Utilisateur';
  await createTaskHistory({
    taskId: newTask.id,
    userId: Number(session.user.id),
    changeType: 'created',
    message: `Tâche créée par ${userName}`
  });

  return NextResponse.json(newTask, { status: 201 });
}