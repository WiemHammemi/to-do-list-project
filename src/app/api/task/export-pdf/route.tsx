import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';
import TasksPDF from '@/components/TasksPDF';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      );
    }

    const tasks = await prisma.task.findMany({
      where: { user_id: Number(session.user.id) },
      orderBy: { created_at: "desc" },
    });

const pdfBuffer = await renderToBuffer(<TasksPDF tasks={tasks} />);



    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="tâches.pdf"',
      },
    });

  } catch (error) {
    console.error("Erreur lors de la génération du PDF:", error);
    return NextResponse.json(
      { error: "Erreur lors de la génération du PDF" },
      { status: 500 }
    );
  }
}