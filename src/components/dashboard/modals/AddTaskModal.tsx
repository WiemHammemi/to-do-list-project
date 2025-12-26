import { Task, TaskToAdd } from "@/types/task";
import { X } from "lucide-react";
import { useState, useEffect } from "react";

interface Props {
  onCreate: (task: TaskToAdd) => void;
  onClose: () => void;
  defaultStatus?: Task["status"];

}

export default function AddTaskModal({ onCreate, onClose, defaultStatus }: Props) {
  const [form, setForm] = useState<TaskToAdd>({
    title: "",
    description: "",
    status: defaultStatus || "pending",
    priority: "low",
    due_date: "",
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    const newErrors: { [key: string]: string } = {};

    if (!form.title.trim()) newErrors.title = "Le titre est requis";
    if (!form.due_date) newErrors.due_date = "La date d'échéance est requise";

    setErrors(newErrors);
    setIsValid(Object.keys(newErrors).length === 0);
  }, [form]);

  const handleBlur = (field: string) => {
    setTouched({ ...touched, [field]: true });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Ajouter une tâche</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Titre</label>
            <input
              placeholder="Titre"
              type="text"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              onBlur={() => handleBlur('title')}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${errors.title && touched.title
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:ring-blue-500"
                }`}
            />
            {errors.title && touched.title && (
              <p className="text-red-500 text-sm mt-1">{errors.title}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              placeholder="Description"
              value={form.description ?? ""}
              onChange={e => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
              <select
                value={form.status}
                onChange={e => setForm({ ...form, status: e.target.value as Task["status"] })}
                disabled={!!defaultStatus}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 ${defaultStatus ? "bg-gray-100 cursor-not-allowed" : "focus:ring-blue-500"
                  }`}
              >
                <option value="pending">En attente</option>
                <option value="progress">En cours</option>
                <option value="completed">Terminée</option>
              </select>

            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Priorité</label>
              <select
                value={form.priority}
                onChange={e => setForm({ ...form, priority: e.target.value as Task["priority"] })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="high">Haute</option>
                <option value="medium">Moyenne</option>
                <option value="low">Basse</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date d'échéance</label>
            <input
              type="date"
              value={form.due_date ? new Date(form.due_date).toISOString().split("T")[0] : ""}
              onChange={e => setForm({ ...form, due_date: e.target.value })}
              onBlur={() => handleBlur('due_date')}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${errors.due_date && touched.due_date
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:ring-blue-500"
                }`}
            />
            {errors.due_date && touched.due_date && (
              <p className="text-red-500 text-sm mt-1">{errors.due_date}</p>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={() => onCreate(form)}
            disabled={!isValid}
            className={`px-4 py-2 rounded-lg text-white transition-colors ${isValid ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-400 cursor-not-allowed"
              }`}
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}