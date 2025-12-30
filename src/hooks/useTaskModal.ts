import { useState } from "react";
import { Task, TaskStatus } from "@/types/task";

export type TaskModalType = "edit" | "delete" | "add" | "import" | null;

export function useTaskModal() {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [modalType, setModalType] = useState<TaskModalType>(null);
  const [modalProps, setModalProps] = useState<{ status?: TaskStatus } | null>(null);

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

  const openAddTaskModal = (status?: TaskStatus) => {
    setModalType("add");
    setModalProps({ status });
  }

  const openImportTaskModal = () => {
    setModalType("import");
  }
  return {
    selectedTask,
    modalType,
    modalProps,
    openEdit,
    openDelete,
    closeModal,
    openAddTaskModal,
    openImportTaskModal,
  };
}
