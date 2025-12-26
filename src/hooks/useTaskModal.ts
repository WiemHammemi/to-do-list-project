import { useState } from "react";
import { Task } from "@/types/task";

export type TaskModalType = "edit" | "delete" | null;

export function useTaskModal() {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [modalType, setModalType] = useState<TaskModalType>(null);

  const openEdit = (task: Task) => {
    setSelectedTask(task);
    setModalType("edit");
  };

  const openDelete = (task: Task) => {
    setSelectedTask(task);
    setModalType("delete");
  };

  const closeModal = () => {
    setSelectedTask(null);
    setModalType(null);
  };

  return {
    selectedTask,
    modalType,
    openEdit,
    openDelete,
    closeModal,
  };
}
