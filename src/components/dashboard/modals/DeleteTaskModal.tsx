import { Task } from "@/types/task";
import { Trash2 } from "lucide-react";

interface Props {
  task: Task;
  onClose: () => void;
  onDelete: (taskId: string) => void;
}
export default function DeleteTaskModal({ task, onDelete, onClose }: Props) {

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-red-100 p-3 rounded-full">
            <Trash2 size={24} className="text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Confirmer la suppression</h2>
        </div>

        <p className="text-gray-600 mb-6">
          Êtes-vous sûr de vouloir supprimer la tâche <b>{task.title}</b> ? Cette action est irréversible.
        </p>

        <div className="flex justify-end gap-3">
          <button
            onClick={() => onClose()}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={() => onDelete(task.id)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}