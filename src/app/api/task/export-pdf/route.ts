import PDFDocument from 'pdfkit';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return new Response(JSON.stringify({ error: "Non autorisé" }), { status: 401 });
  }

  const tasks = await prisma.task.findMany({
    where: { user_id: Number(session.user.id) },
    orderBy: { created_at: "desc" },
  });

  const doc = new PDFDocument({ 
    size: 'A4', 
    margin: 50,
    info: {
      Title: 'Liste des Tâches',
      Author: 'Task Manager',
    }
  });

  const chunks: Buffer[] = [];

  doc.on('data', (chunk) => chunks.push(chunk));

  const pdfPromise = new Promise<Buffer>((resolve) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
  });

  doc.fontSize(24)
     .fillColor('#3B82F6')
     .text('Liste des Tâches', { align: 'center' })
     .moveDown(0.5);

  doc.fontSize(10)
     .fillColor('#6B7280')
     .text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, { align: 'center' })
     .moveDown(1.5);

  const stats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    progress: tasks.filter(t => t.status === 'progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
  };

  doc.fontSize(12)
     .fillColor('#374151')
     .text(`Total: ${stats.total} tâches | En attente: ${stats.pending} | En cours: ${stats.progress} | Terminées: ${stats.completed}`, { align: 'center' })
     .moveDown(2);

  const tableTop = doc.y;
  const colWidths = {
    title: 180,
    status: 80,
    priority: 70,
    dueDate: 80,
  };
  const rowHeight = 25;

  doc.rect(50, tableTop, 495, rowHeight)
     .fillAndStroke('#3B82F6', '#3B82F6');

  doc.fontSize(10)
     .fillColor('#FFFFFF')
     .text('Titre', 55, tableTop + 8, { width: colWidths.title, align: 'left' })
     .text('Statut', 55 + colWidths.title, tableTop + 8, { width: colWidths.status, align: 'center' })
     .text('Priorité', 55 + colWidths.title + colWidths.status, tableTop + 8, { width: colWidths.priority, align: 'center' })
     .text('Échéance', 55 + colWidths.title + colWidths.status + colWidths.priority, tableTop + 8, { width: colWidths.dueDate, align: 'center' });

  let currentY = tableTop + rowHeight;

  const translateStatus = (status: string) => {
    const translations: Record<string, string> = {
      'pending': 'En attente',
      'progress': 'En cours',
      'completed': 'Terminée'
    };
    return translations[status] || status;
  };

  const translatePriority = (priority: string) => {
    const translations: Record<string, string> = {
      'high': 'Haute',
      'medium': 'Moyenne',
      'low': 'Basse'
    };
    return translations[priority] || priority;
  };

  tasks.forEach((task, index) => {
    if (currentY > 700) {
      doc.addPage();
      currentY = 50;
    }

    const bgColor = index % 2 === 0 ? '#F9FAFB' : '#FFFFFF';
    doc.rect(50, currentY, 495, rowHeight)
       .fill(bgColor);

    let priorityColor = '#374151';
    if (task.priority === 'high') priorityColor = '#DC2626';
    else if (task.priority === 'medium') priorityColor = '#F59E0B';
    else if (task.priority === 'low') priorityColor = '#10B981';

    doc.fontSize(9)
       .fillColor('#374151')
       .text(task.title, 55, currentY + 8, { 
         width: colWidths.title - 10, 
         align: 'left',
         ellipsis: true 
       })
       .text(translateStatus(task.status), 55 + colWidths.title, currentY + 8, { 
         width: colWidths.status, 
         align: 'center' 
       })
       .fillColor(priorityColor)
       .text(translatePriority(task.priority), 55 + colWidths.title + colWidths.status, currentY + 8, { 
         width: colWidths.priority, 
         align: 'center' 
       })
       .fillColor('#374151')
       .text(
         task.due_date ? new Date(task.due_date).toLocaleDateString('fr-FR') : '-', 
         55 + colWidths.title + colWidths.status + colWidths.priority, 
         currentY + 8, 
         { width: colWidths.dueDate, align: 'center' }
       );

    // Ligne de séparation
    doc.strokeColor('#E5E7EB')
       .lineWidth(0.5)
       .moveTo(50, currentY + rowHeight)
       .lineTo(545, currentY + rowHeight)
       .stroke();

    currentY += rowHeight;
  });

  doc.fontSize(8)
     .fillColor('#9CA3AF')
     .text(
       `Document généré automatiquement - ${tasks.length} tâche${tasks.length > 1 ? 's' : ''} au total`,
       50,
       doc.page.height - 50,
       { align: 'center', width: 495 }
     );

  doc.end();

  const buffer = await pdfPromise;

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="tâches.pdf"',
    },
  });
}