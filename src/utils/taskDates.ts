import { AlertCircle, Flame, Clock } from "lucide-react";
import { Task } from "@/types/task";

export const getUrgencyIndicator = (task: Task) => {
  if (!task.due_date || task.status === "completed") return null;

  const dueDate = new Date(task.due_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dueDate.setHours(0, 0, 0, 0);

  const daysUntilDue = Math.ceil(
    (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysUntilDue < 0) {
    return {
      label: "EN RETARD",
      sublabel: `${Math.abs(daysUntilDue)}j`,
      bg: "bg-red-500",
      text: "text-white",
      icon: AlertCircle,
      pulse: false,
    };
  }

  if (daysUntilDue === 0) {
    return {
      label: "AUJOURD'HUI",
      sublabel: "0j",
      bg: "bg-orange-500",
      text: "text-white",
      icon: Flame,
      pulse: true,
    };
  }

  if (daysUntilDue <= 3) {
    return {
      label: "BIENTÔT",
      sublabel: `${daysUntilDue}j`,
      bg: "bg-yellow-400",
      text: "text-gray-800",
      icon: Clock,
      pulse: true,
    };
  }

  return null;
};
