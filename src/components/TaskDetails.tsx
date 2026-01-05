'use client';
import { useEffect, useState } from 'react';
import { Calendar, Flag, Clock, CheckCircle2, Edit, Trash2, MessageSquare, Activity, Flame, AlertCircle } from 'lucide-react';
import UserAccountNav from '@/components/UserAccountNav';
import { Task, TaskPriority, TaskStatus } from '@/types/task';
import { useTaskModal } from '@/hooks/useTaskModal';
import DeleteTaskModal from './dashboard/modals/DeleteTaskModal';
import { useRouter } from 'next/navigation';
import EditTaskModal from './dashboard/modals/EditTaskModal';
import { getUrgencyIndicator } from '@/utils/taskDates';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchTasks, updateTask, deleteTask } from '@/store/slices/taskSlice';

interface HistoryItem {
  id: number;
  change_type: string;
  field_name: string;
  message: string;
  created_at: string;
  user: {
    name: string;
    email: string;
  };
}

export default function TaskDetails({ taskId }: { taskId: string }) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { tasks, loading, error } = useAppSelector((state) => state.tasks);
  const task = tasks.find(t => String(t.id) === taskId);
  
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  
  const {
    selectedTask,
    modalType,
    openEdit,
    openDelete,
    closeModal
  } = useTaskModal();

  useEffect(() => {
    if (tasks.length === 0) {
      dispatch(fetchTasks());
    }
  }, [dispatch, tasks.length]);

useEffect(() => {
  if (taskId) {
    setHistoryLoading(true);
    fetch(`/api/task/${taskId}/history`)
      .then(res => {
        if (!res.ok) throw new Error('Erreur chargement historique');
        return res.json();
      })
      .then(data => {
        setHistory(data.data ?? []);
        setHistoryLoading(false);
      })
      .catch(err => {
        console.error('Erreur chargement historique:', err);
        setHistory([]);
        setHistoryLoading(false);
      });
  }
}, [taskId]);

  console.log("history", history);

  const handleDelete = async (id: string) => {
    try {
      await dispatch(deleteTask(id)).unwrap();
      closeModal();
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Erreur suppression tâche :", err);
      alert("Impossible de supprimer la tâche : " + err);
    }
  };

  const handleSaveEdit = async (updatedTask: Task) => {
    try {
      await dispatch(updateTask(updatedTask)).unwrap();
      closeModal();
      
      const res = await fetch(`/api/task/${taskId}/history`);
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (err: any) {
      console.error("Erreur modification tâche :", err);
      alert("Impossible de modifier la tâche : " + err);
    }
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'pending': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: TaskStatus) => {
    switch (status) {
      case 'pending': return 'En attente';
      case 'progress': return 'En cours';
      case 'completed': return 'Terminée';
      default: return status;
    }
  };

  const getPriorityLabel = (priority: TaskPriority) => {
    switch (priority) {
      case 'high': return 'Haute';
      case 'medium': return 'Moyenne';
      case 'low': return 'Basse';
      default: return priority;
    }
  };

  const formatDate = (date?: string | null) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActivityIcon = (field: string) => {
    switch (field) {
      case 'status': return <CheckCircle2 size={16} className="text-blue-600" />;
      case 'priority': return <Flag size={16} className="text-orange-600" />;
      case 'created': return <Activity size={16} className="text-purple-600" />;
      case 'description': return <MessageSquare size={16} className="text-green-600" />;
      case 'title': return <Edit size={16} className="text-blue-600" />;
      case 'updated': return <Edit size={16} className="text-blue-600" />;
      case 'deleted': return <Trash2 size={16} className="text-red-600" />;
      default: return <Activity size={16} className="text-gray-600" />;
    }
  };

  const urgencyIndicator = task ? getUrgencyIndicator(task) : null;

  if (loading) {
    return <div className="p-6">Chargement...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-600">{error}</div>;
  }

  if (!task) {
    return <div className="p-6">Aucune tâche trouvée</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <UserAccountNav />
      
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{task.title}</h1>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(task.status)}`}>
                {getStatusLabel(task.status)}
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getPriorityColor(task.priority)}`}>
                Priorité {getPriorityLabel(task.priority)}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => openEdit(task)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Edit size={18} />
              Modifier
            </button>
            <button
              onClick={() => openDelete(task)}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Trash2 size={18} />
              Supprimer
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Description</h2>
              <p className="text-gray-700 leading-relaxed">{task.description}</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Activity size={22} />
                Historique d'activité
              </h2>
              {historyLoading ? (
                <p className="text-gray-500">Chargement de l'historique...</p>
              ) : history.length === 0 ? (
                <p className="text-gray-500">Aucune activité enregistrée</p>
              ) : (
                <div className="space-y-3">
                  {history.map(item => (
                    <div key={item.id} className="flex gap-3 items-start">
                      <div className="flex-shrink-0 mt-1">
                        {getActivityIcon(item.field_name )}
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-700">{item.message}</p>
                        <p className="text-sm text-gray-500 mt-1">{formatDateTime(item.created_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations</h3>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <Calendar size={18} />
                    <span className="text-sm font-medium">Date d'échéance</span>
                  </div>
                  <p className="text-gray-900 ml-6">{formatDate(task.due_date)}</p>
                  {urgencyIndicator && (
                    <div
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg mt-2 ml-6
                      ${urgencyIndicator.bg} ${urgencyIndicator.text}
                      shadow-md ${urgencyIndicator.pulse ? 'animate-pulse' : ''}`}
                    >
                      <urgencyIndicator.icon size={16} />
                      <span className="text-sm font-semibold">
                        {urgencyIndicator.label} {urgencyIndicator.sublabel}
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <Clock size={18} />
                    <span className="text-sm font-medium">Créée le</span>
                  </div>
                  <p className="text-gray-900 ml-6">{formatDate(task.created_at)}</p>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <Activity size={18} />
                    <span className="text-sm font-medium">Dernière modification</span>
                  </div>
                  <p className="text-gray-900 ml-6">{formatDate(task.updated_at)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {modalType === "edit" && selectedTask && (
        <EditTaskModal
          task={selectedTask}
          onClose={closeModal}
          onSave={handleSaveEdit}
        />
      )}

      {modalType === "delete" && selectedTask && (
        <DeleteTaskModal 
          task={selectedTask} 
          onClose={closeModal} 
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}