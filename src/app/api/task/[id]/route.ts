import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

interface Params {
  id: string;
}
export async function GET(request: Request,{ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json(({ error: "Non autorisé" }), { status: 401 });
  }

  const task = await prisma.task.findFirst({
    where: { id: Number(id), user_id: Number(session.user.id) }
  });

  if (!task) {
    return NextResponse.json(({ error: "Tâche non trouvée" }), { status: 404 });
  }

  return NextResponse.json(task, { status: 200 });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const body = await request.json();

  const currentTask = await prisma.task.findFirst({
    where: { id: Number(id), user_id: Number(session.user.id) }
  });

  if (!currentTask) {
    return NextResponse.json({ error: "Tâche non trouvée" }, { status: 404 });
  }

  const updateData: any = {
    title: body.title,
    description: body.description,
    status: body.status,
    priority: body.priority,
    due_date: body.due_date ? new Date(body.due_date) : undefined,
  };

  if (body.status && body.status !== currentTask.status) {
    updateData.status_changed_at = new Date();
  }

  const updatedTask = await prisma.task.update({
    where: { id: Number(id) },
    data: updateData,
  });

  return NextResponse.json(updatedTask, { status: 200 });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  if (isNaN(Number(id))) {
    return NextResponse.json({ error: "ID invalide" }, { status: 400 });
  }

  const result = await prisma.task.deleteMany({
    where: { id: Number(id), user_id: Number(session.user.id) },
  });

  if (result.count === 0) {
    return NextResponse.json({ error: "Tâche non trouvée" }, { status: 404 });
  }

  return NextResponse.json({ status: "Tâche supprimée" }, { status: 200 });
}
