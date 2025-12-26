import { Clock, Edit, Eye, Trash2, Flag, Calendar, MoreVertical } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Task, TaskPriority } from "@/types/task";

interface Props {
  task:  Task;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

export default function TaskCard({ task, onEdit, onDelete }:  Props) {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);

  const handleOnClick = (id: string) => {
    router.push(`/tasks/${id}`);
  };

  const getPriorityConfig = (priority: TaskPriority) => {
    switch(priority) {
      case 'high': 
        return { 
          color: 'text-red-600', 
          bg: 'bg-red-50', 
          border: 'border-red-100',
          dot: 'bg-red-400',
          label: 'Haute'
        };
      case 'medium': 
        return { 
          color: 'text-amber-600', 
          bg: 'bg-amber-50', 
          border: 'border-amber-100',
          dot: 'bg-amber-400',
          label: 'Moyenne'
        };
      case 'low': 
        return { 
          color: 'text-emerald-600', 
          bg: 'bg-emerald-50', 
          border: 'border-emerald-100',
          dot: 'bg-emerald-400',
          label: 'Basse'
        };
      default: 
        return { 
          color: 'text-gray-600', 
          bg: 'bg-gray-50', 
          border: 'border-gray-100',
          dot: 'bg-gray-400',
          label: priority
        };
    }
  };

  const priorityConfig = getPriorityConfig(task.priority);
  const dueDate = new Date(task.due_date);
  const today = new Date();
  const isOverdue = dueDate < today && task.status !== 'completed';
  const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  const priorityHoverBorder = task.priority === 'high' ? 'hover:border-red-300' :
                            task.priority === 'medium' ? 'hover:border-amber-300' :
                            task.priority === 'low' ? 'hover:border-emerald-300' : 'hover:border-gray-200';


  return (
    <div className={`group relative bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md  transition-all duration-300 overflow-hidden ${priorityConfig.border} ${priorityHoverBorder}`}>

      <div className={`h-1 ${priorityConfig.dot}`}></div>
      
      <div className="p-5">

        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-800 text-lg leading-tight mb-1 group-hover:text-blue-500 transition-colors cursor-pointer" onClick={() => handleOnClick(task.id)}>
              {task.title}
            </h3>
          </div>
          
          <div className="relative">
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 hover:bg-gray-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
            >
              <MoreVertical size={18} className="text-gray-400" />
            </button>
            
            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-10">
                <button onClick={() => { handleOnClick(task.id); setShowMenu(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                  <Eye size={16} />
                  Voir les détails
                </button>
                <button onClick={() => { onEdit(task); setShowMenu(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                  <Edit size={16} />
                  Modifier
                </button>
                <div className="border-t border-gray-100 my-1"></div>
                <button onClick={() => { onDelete(task); setShowMenu(false); }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                  <Trash2 size={16} />
                  Supprimer
                </button>
              </div>
            )}
          </div>
        </div>

        <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">
          {task.description}
        </p>

        <div className="flex items-center gap-2 mb-4 flex-wrap">

          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${priorityConfig.bg} border ${priorityConfig.border}`}>
            <Flag size={12} className={priorityConfig.color} />
            <span className={`text-xs font-medium ${priorityConfig.color}`}>
              {priorityConfig.label}
            </span>
          </div>

          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${isOverdue ? 'bg-red-50 border border-red-100' : 'bg-gray-50 border border-gray-100'}`}>
            <Calendar size={12} className={isOverdue ? 'text-red-500' : 'text-gray-500'} />
            <span className={`text-xs font-medium ${isOverdue ? 'text-red-500' : 'text-gray-600'}`}>
              {dueDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
            </span>
          </div>

          {!isOverdue && daysUntilDue <= 3 && daysUntilDue > 0 && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-50 border border-orange-100">
              <Clock size={12} className="text-orange-500" />
              <span className="text-xs font-medium text-orange-500">
                {daysUntilDue}j restant{daysUntilDue > 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button 
            onClick={() => handleOnClick(task.id)} 
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-all duration-200 shadow-sm"
          >
            <Eye size={16} />
            Voir
          </button>
          
          <button 
            onClick={() => onEdit(task)} 
            className="px-3 py-2.5 text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors border border-gray-200 hover:border-blue-200"
            title="Modifier"
          >
            <Edit size={18} />
          </button>
          
          <button 
            onClick={() => onDelete(task)} 
            className="px-3 py-2.5 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-gray-200 hover:border-red-200"
            title="Supprimer"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

    </div>
  );
}