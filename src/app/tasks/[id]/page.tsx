import TaskDetails from '@/components/TaskDetails';

export default function TaskPage({ params }: { params: { id: string } }) {
  return (
  <TaskDetails taskId={params.id} />
    ) ;
}