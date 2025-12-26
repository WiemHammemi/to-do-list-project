"use client";

import { useState, useEffect  } from 'react';
import {Clock, AlertCircle, CheckCircle2, Plus, Filter, Search, Upload, Download, FileText } from 'lucide-react';
import UserAccountNav from '@/components/UserAccountNav';
import StatusColumn from '@/components/dashboard/StatusColumn';
import EditTaskModal from '@/components/dashboard/modals/EditTaskModal';
import DeleteTaskModal from '@/components/dashboard/modals/DeleteTaskModal';
import { Task } from '@/types/task';
import { useTaskModal } from '@/hooks/useTaskModal';

export default function DashboardClient() {
  
const [tasks, setTasks] = useState<Task[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

const {
  selectedTask,
  modalType,
  openEdit,
  openDelete,
  closeModal
} = useTaskModal();

  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const progressTasks = tasks.filter(t => t.status === 'progress');
  const completedTasks = tasks.filter(t => t.status === 'completed');

  const stats = {
    total: tasks.length,
    pending: pendingTasks.length,
    progress: progressTasks.length,
    completed: completedTasks.length,
    completionRate: tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0
  };

  const fetchTasks = async () => {
  try {
    setLoading(true);
    const res = await fetch("/api/task");

    if (!res.ok) {
      throw new Error("Erreur lors du chargement des tâches");
    }

    const data = await res.json();
    setTasks(data);
  } catch (err: any) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};
    useEffect(() => {
        fetchTasks();
    }, []);


const handleDelete = async (id: string) => {
  try {
    const res = await fetch(`/api/task/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Erreur lors de la suppression");
    }
    setTasks(prev => prev.filter(t => t.id !== id));
    closeModal();
  } catch (err: any) {
    console.error("Erreur suppression tâche :", err.message);
    alert("Impossible de supprimer la tâche : " + err.message);
  }
};


  const handleSaveEdit = async (updatedTask: Task) => {
    try {
      const res = await fetch(`/api/task/${updatedTask.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedTask),
      });

      if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Erreur lors de la modification.");
    }

    setTasks(prev =>
      prev.map(t => (t.id === updatedTask.id ? updatedTask : t))
    );
    closeModal();

    }
    catch (err: any) {
      console.error("Erreur modification tâche :", err.message);
      alert("Impossible de modifier la tâche : " + err.message);
      return;
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
      <div className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-40 border-b border-gray-200">
        <UserAccountNav />
      </div>

      <div className="max-w-[1800px] mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Tableau de bord des tâches
              </h1>
              <p className="text-gray-600 text-lg">Gérez vos tâches et suivez leur progression</p>
            </div>
            
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm">
                <Search size={18} className="text-gray-500" />
                <span className="text-gray-700">Rechercher</span>
              </button>
              <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm">
                <Filter size={18} className="text-gray-500" />
                <span className="text-gray-700">Filtrer</span>
              </button>
              
              <div className="h-8 w-px bg-gray-200"></div>
              
              <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm">
                <Upload size={18} className="text-emerald-500" />
                <span className="text-gray-700">Importer</span>
              </button>
              <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm">
                <Download size={18} className="text-blue-500" />
                <span className="text-gray-700">Exporter</span>
              </button>
              <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm">
                <FileText size={18} className="text-purple-500" />
                <span className="text-gray-700">Structure</span>
              </button>
              
              <div className="h-8 w-px bg-gray-200"></div>
              
              <button className="flex items-center gap-2 px-5 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all shadow-sm hover:shadow-md">
                <Plus size={20} />
                <span className="font-medium">Nouvelle tâche</span>
              </button>
            </div>
          </div>

          
        </div>

        {loading && (
             <div className="min-h-screen flex items-center justify-center">
      Chargement des tâches...
    </div>
        )}

        {error && (
          <div className="min-h-screen flex items-center justify-center text-red-600">
            {error}
          </div>
        )}

       {!loading && !error && tasks.length > 0 &&(
        <div className="flex gap-6 overflow-x-auto pb-6">
          <StatusColumn title="En attente" tasks={pendingTasks} onEdit={openEdit} onDelete={openDelete} icon={<AlertCircle size={20} className="text-amber-600"/>} color="bg-amber-50" />
          <StatusColumn title="En cours" tasks={progressTasks} onEdit={openEdit} onDelete={openDelete} icon={<Clock size={20} className="text-blue-600"/>} color="bg-blue-50" />
          <StatusColumn title="Terminées" tasks={completedTasks} onEdit={openEdit} onDelete={openDelete} icon={<CheckCircle2 size={20} className="text-green-600"/>} color="bg-green-50" />
        </div>
       )}
      </div>

      {modalType === "edit" && selectedTask && (
        <EditTaskModal task={selectedTask} onClose={closeModal} onSave={handleSaveEdit} />
      )}

      {modalType === "delete" && selectedTask && (
        <DeleteTaskModal task={selectedTask} onClose={closeModal} onDelete={handleDelete} />
      )}
    </div>
  );
}