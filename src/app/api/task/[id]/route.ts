import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createTaskHistory, generateChangeMessage } from "@/lib/taskHistory";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const task = await prisma.task.findFirst({
    where: { id: Number(id), user_id: Number(session.user.id) }
  });

  if (!task) {
    return NextResponse.json({ error: "Tâche non trouvée" }, { status: 404 });
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

  const userId = Number(session.user.id);
  const userName = session.user.name || 'Utilisateur';

  const areDatesEqual = (date1: any, date2: any): boolean => {
    if (!date1 || !date2) return date1 === date2;
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return d1.getTime() === d2.getTime();
  };

  const formatValueForDisplay = (field: string, value: any): string => {
    if (!value) return '';
    
    if (field === 'due_date') {
      return new Date(value).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    }
    
    return String(value);
  };

  if (body.title !== undefined && body.title !== currentTask.title) {
    const message = generateChangeMessage(
      'title',
      currentTask.title,
      body.title,
      userName
    );

    await createTaskHistory({
      taskId: Number(id),
      userId,
      changeType: 'updated',
      fieldName: 'title',
      oldValue: currentTask.title,
      newValue: body.title,
      message
    });
  }

  if (body.description !== undefined && body.description !== currentTask.description) {
    const message = generateChangeMessage(
      'description',
      currentTask.description || '',
      body.description,
      userName
    );

    await createTaskHistory({
      taskId: Number(id),
      userId,
      changeType: 'updated',
      fieldName: 'description',
      oldValue: currentTask.description || '',
      newValue: body.description,
      message
    });
  }

  if (body.status !== undefined && body.status !== currentTask.status) {
    const message = generateChangeMessage(
      'status',
      currentTask.status,
      body.status,
      userName
    );

    await createTaskHistory({
      taskId: Number(id),
      userId,
      changeType: 'updated',
      fieldName: 'status',
      oldValue: currentTask.status,
      newValue: body.status,
      message
    });
  }

  if (body.priority !== undefined && body.priority !== currentTask.priority) {
    const message = generateChangeMessage(
      'priority',
      currentTask.priority,
      body.priority,
      userName
    );

    await createTaskHistory({
      taskId: Number(id),
      userId,
      changeType: 'updated',
      fieldName: 'priority',
      oldValue: currentTask.priority,
      newValue: body.priority,
      message
    });
  }

  if (body.due_date !== undefined && !areDatesEqual(currentTask.due_date, body.due_date)) {
    const oldDateFormatted = formatValueForDisplay('due_date', currentTask.due_date);
    const newDateFormatted = formatValueForDisplay('due_date', body.due_date);
    
    const message = `Date d'échéance modifiée de ${oldDateFormatted} à ${newDateFormatted} par ${userName}`;

    await createTaskHistory({
      taskId: Number(id),
      userId,
      changeType: 'updated',
      fieldName: 'due_date',
      oldValue: oldDateFormatted,
      newValue: newDateFormatted,
      message
    });
  }

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

  const task = await prisma.task.findFirst({
    where: { id: Number(id), user_id: Number(session.user.id) }
  });

  if (task) {
    const userName = session.user.name || 'Utilisateur';
    await createTaskHistory({
      taskId: Number(id),
      userId: Number(session.user.id),
      changeType: 'deleted',
      message: `Tâche supprimée par ${userName}`
    });
  }

  const result = await prisma.task.deleteMany({
    where: { id: Number(id), user_id: Number(session.user.id) },
  });

  if (result.count === 0) {
    return NextResponse.json({ error: "Tâche non trouvée" }, { status: 404 });
  }

  return NextResponse.json({ status: "Tâche supprimée" }, { status: 200 });
}