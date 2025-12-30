"use client";

import { useEffect, useRef } from 'react';
import { Clock, AlertCircle, CheckCircle2, Plus, Upload, Download, FileText, FileSpreadsheet, FileDown } from 'lucide-react';
import UserAccountNav from '@/components/UserAccountNav';
import StatusColumn from '@/components/dashboard/StatusColumn';
import EditTaskModal from '@/components/dashboard/modals/EditTaskModal';
import DeleteTaskModal from '@/components/dashboard/modals/DeleteTaskModal';
import { Task, TaskToAdd } from '@/types/task';
import { useTaskModal } from '@/hooks/useTaskModal';
import AddTaskModal from '@/components/dashboard/modals/AddTaskModal';
import TaskCard from '@/components/dashboard/TaskCard';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors} from '@dnd-kit/core';
import ExcelImportModal from '@/components/dashboard/modals/ImportModal';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchTasks, createTask, updateTask, deleteTask, updateTaskStatus } from '@/store/slices/taskSlice';
import { useState } from 'react';

export default function DashboardClient() {
  const dispatch = useAppDispatch();
  const { tasks, loading, error } = useAppSelector((state) => state.tasks);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const progressTasks = tasks.filter(t => t.status === 'progress');
  const completedTasks = tasks.filter(t => t.status === 'completed');

  const {
    selectedTask,
    modalType,
    modalProps,
    openEdit,
    openDelete,
    openAddTaskModal,
    openImportTaskModal,
    closeModal
  } = useTaskModal();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, 
      },
    })
  );

  const stats = {
    total: tasks.length,
    pending: pendingTasks.length,
    progress: progressTasks.length,
    completed: completedTasks.length,
    completionRate: tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0
  };

  // Charger les tâches au montage du composant
  useEffect(() => {
    dispatch(fetchTasks());
  }, [dispatch]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find(t => t.id === active.id);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.id as Task['status'];

    const task = tasks.find(t => t.id === taskId);
    if (!task || task.status === newStatus) return;

    try {
      await dispatch(updateTaskStatus({ taskId, status: newStatus })).unwrap();
    } catch (err: any) {
      console.error("Erreur lors du changement de statut:", err);
      alert("Impossible de changer le statut : " + err);
    }
  };

  const handleDragCancel = () => {
    setActiveTask(null);
  };

  const handleDelete = async (id: string) => {
    try {
      await dispatch(deleteTask(id)).unwrap();
      closeModal();
    } catch (err: any) {
      console.error("Erreur suppression tâche :", err);
      alert("Impossible de supprimer la tâche : " + err);
    }
  };

  const handleSaveEdit = async (updatedTask: Task) => {
    try {
      await dispatch(updateTask(updatedTask)).unwrap();
      closeModal();
    } catch (err: any) {
      console.error("Erreur modification tâche :", err);
      alert("Impossible de modifier la tâche : " + err);
    }
  };

  const handleCreate = async (form: TaskToAdd) => {
    try {
      await dispatch(createTask(form)).unwrap();
      closeModal();
    } catch (err: any) {
      console.error("Erreur d'ajout de la tâche :", err);
      alert("Impossible d'ajouter la tâche : " + err);
    }
  };

  const exportStructure = async () => {
    try {
      const res = await fetch("/api/task/export-structure");

      if (!res.ok) {
        throw new Error("Erreur lors du téléchargement");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "structure.xlsx";
      a.click();

      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error(err);
      alert("Impossible de télécharger la structure");
    }
  };

  const exportData = async (format: 'excel' | 'pdf') => {
    try {
      const endpoint = format === 'excel' ? '/api/task/export-excel' : '/api/task/export-pdf';
      const res = await fetch(endpoint);
      
      if (!res.ok) {
        throw new Error("Erreur lors du téléchargement");
      } 

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = format === 'excel' ? "tâches.xlsx" : "tâches.pdf";
      a.click();

      window.URL.revokeObjectURL(url);
      setShowExportMenu(false);
    } catch (err: any) {
      console.error(err);
      alert("Impossible de télécharger les données");
    }
  };

  const handleImportSuccess = () => {
    // Recharger les tâches après un import réussi
    dispatch(fetchTasks());
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
              <button onClick={() => openImportTaskModal() } className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm">
                <Upload size={18} className="text-emerald-500" />
                <span className="text-gray-700">Importer</span>
              </button>

              <div className="relative" ref={exportMenuRef}>
                <button 
                  onClick={() => setShowExportMenu(!showExportMenu)} 
                  className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                >
                  <Download size={18} className="text-blue-500" />
                  <span className="text-gray-700">Exporter</span>
                </button>

                {showExportMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <button 
                      onClick={() => exportData('excel')}
                      className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 flex items-center gap-3 transition-colors"
                    >
                      <FileSpreadsheet size={18} className="text-green-600" />
                      <div>
                        <div className="font-medium">Exporter en Excel</div>
                        <div className="text-xs text-gray-500">Format .xlsx</div>
                      </div>
                    </button>
                    <div className="border-t border-gray-100 my-1"></div>
                    <button 
                      onClick={() => exportData('pdf')}
                      className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-red-50 flex items-center gap-3 transition-colors"
                    >
                      <FileDown size={18} className="text-red-600" />
                      <div>
                        <div className="font-medium">Exporter en PDF</div>
                        <div className="text-xs text-gray-500">Format .pdf</div>
                      </div>
                    </button>
                  </div>
                )}
              </div>

              <button onClick={() => exportStructure()} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm">
                <FileText size={18} className="text-purple-500" />
                <span className="text-gray-700">Structure</span>
              </button>

              <div className="h-8 w-px bg-gray-200"></div>

              <button onClick={() => openAddTaskModal()} className="flex items-center gap-2 px-5 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all shadow-sm hover:shadow-md">
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

        {!loading && !error && tasks.length > 0 && (
          <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <div className="flex gap-6 overflow-x-auto pb-6">
              <StatusColumn
                title="En attente"
                tasks={pendingTasks}
                onClick={() => openAddTaskModal("pending")}
                onEdit={openEdit}
                onDelete={openDelete}
                icon={<AlertCircle size={20} className="text-amber-600" />}
                color="bg-amber-50"
                columnId="pending"
              />
              <StatusColumn
                title="En cours"
                tasks={progressTasks}
                onClick={() => openAddTaskModal("progress")}
                onEdit={openEdit}
                onDelete={openDelete}
                icon={<Clock size={20} className="text-blue-600" />}
                color="bg-blue-50"
                columnId="progress"
              />
              <StatusColumn
                title="Terminées"
                tasks={completedTasks}
                onClick={() => openAddTaskModal("completed")}
                onEdit={openEdit}
                onDelete={openDelete}
                icon={<CheckCircle2 size={20} className="text-green-600" />}
                color="bg-green-50"
                columnId="completed"
              />
            </div>

            <DragOverlay>
              {activeTask ? (
                <div className="opacity-80 rotate-3 scale-105">
                  <TaskCard
                    task={activeTask}
                    onEdit={() => {}}
                    onDelete={() => {}}
                  />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      {modalType === "edit" && selectedTask && (
        <EditTaskModal task={selectedTask} onClose={closeModal} onSave={handleSaveEdit} />
      )}

      {modalType === "delete" && selectedTask && (
        <DeleteTaskModal task={selectedTask} onClose={closeModal} onDelete={handleDelete} />
      )}

      {modalType === "add" && (
        <AddTaskModal onClose={closeModal} onCreate={handleCreate} defaultStatus={modalProps?.status} />
      )}

       {modalType === "import" && (
        <ExcelImportModal onClose={closeModal} onSuccess={handleImportSuccess} />
      )}
    </div>
  );
}