import { prisma } from '@/lib/prisma';

export async function createTaskHistory({
  taskId,
  userId,
  changeType,
  fieldName,
  oldValue,
  newValue,
  message
}: {
  taskId: number;
  userId: number;
  changeType: 'status' | 'priority' | 'created' | 'updated' | 'deleted' | 'title' | 'description' | 'due_date';
  fieldName?: string;
  oldValue?: string;
  newValue?: string;
  message: string;
}) {
  return await prisma.taskHistory.create({
    data: {
      task_id: taskId,
      user_id: userId,
      change_type: changeType,
      field_name: fieldName,
      old_value: oldValue,
      new_value: newValue,
      message
    }
  });
}

export function generateChangeMessage(
  fieldName: string,
  oldValue: string,
  newValue: string,
  userName: string
): string {
  switch (fieldName) {
    case 'status':
      return `Statut changé de '${getStatusLabel(oldValue)}' à '${getStatusLabel(newValue)}' par ${userName}`;
    case 'priority':
      return `Priorité changée de '${getPriorityLabel(oldValue)}' à '${getPriorityLabel(newValue)}' par ${userName}`;
    case 'title':
      return `Titre modifié par ${userName}`;
    case 'description':
      return `Description modifiée par ${userName}`;
    case 'due_date':
      return `Date d'échéance modifiée par ${userName}`;
    default:
      return `Modification effectuée par ${userName}`;
  }
}

function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    'pending': 'En attente',
    'progress': 'En cours',
    'completed': 'Terminée'
  };
  return labels[status] || status;
}

function getPriorityLabel(priority: string) {
  const labels: Record<string, string> = {
    'high': 'Haute',
    'medium': 'Moyenne',
    'low': 'Basse'
  };
  return labels[priority] || priority;
}