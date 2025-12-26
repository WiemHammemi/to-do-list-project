import TaskCard from "@/components/dashboard/TaskCard";
import { Task } from "@/types/task";
import { Plus, CheckCircle } from "lucide-react";

interface Props {
  title: string;
  icon: React.ReactNode;
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  color: string;
}

export default function StatusColumn({ title, icon, tasks, onEdit, onDelete, color}: Props) {

  const getColorVariants = (colorClass: string) => {
    if (colorClass.includes('orange')) {
      return {
        light: 'bg-amber-50',
        border: 'border-amber-200',
        gradient: 'from-amber-50 to-amber-100',
        text: 'text-amber-600',
        badge: 'bg-amber-400',
        shadow: 'shadow-amber-100'
      };
    } else if (colorClass.includes('blue')) {
      return {
        light: 'bg-blue-50',
        border: 'border-blue-200',
        gradient: 'from-blue-50 to-blue-100',
        text: 'text-blue-700',
        badge: 'bg-blue-600',
        shadow: 'shadow-blue-100'
      };
    } else if (colorClass.includes('green')) {
      return {
        light: 'bg-green-50',
        border: 'border-green-200',
        gradient: 'from-green-50 to-green-100',
        text: 'text-green-700',
        badge: 'bg-green-600',
        shadow: 'shadow-green-100'
      };
    }
    return {
      light: 'bg-amber-50',
      border: 'border-amber-200',
      gradient: 'from-amber-50 to-amber-100',
      text: 'text-amber-600',
      badge: 'bg-amber-400',
      shadow: 'shadow-amber-100'
    };
  };

  const colors = getColorVariants(color);

  return (
    <div className="flex-1 min-w-[320px] flex flex-col">

      <div className={`bg-gradient-to-br ${colors.gradient} rounded-xl p-4 mb-4 border-2 ${colors.border} ${colors.shadow} shadow-md`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className={`p-2 bg-white rounded-lg ${colors.shadow} shadow-sm`}>
              {icon}
            </div>
            <div>
              <h2 className={`font-bold text-lg ${colors.text}`}>{title}</h2>
              <p className="text-xs text-gray-600">
                {tasks.length} tâche{tasks.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          
          <div className={`${colors.badge} text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-md`}>
            {tasks.length}
          </div>
        </div>

        {tasks.length > 0 && (
          <div className="mt-3">
            <div className="h-1.5 bg-white rounded-full overflow-hidden shadow-inner">
              <div 
                className={`h-full ${colors.badge} transition-all duration-500 rounded-full`}
                style={{ width: `${Math.min((tasks.length / 10) * 100, 100)}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto pr-2 pb-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        {tasks.length > 0 ? (
          tasks.map((task: Task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))
        ) : (
          <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium mb-1">Aucune tâche</p>
            <p className="text-gray-400 text-sm">Cette colonne est vide</p>
          </div>
        )}
      </div>

      <button className={`mt-4 w-full py-3 border-2 border-dashed ${colors.border} ${colors.light} hover:bg-white rounded-xl transition-all duration-200 flex items-center justify-center gap-2 ${colors.text} font-medium hover:shadow-md group`}>
        <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
        <span>Ajouter une tâche</span>
      </button>
    </div>
  );
}

