import TaskDetails from '@/components/TaskDetails';

export default async  function TaskPage({ params }: { params: Promise<{ id: string }> }) {
  const param = await params;

  return (
  <TaskDetails taskId={param.id} />
    ) ;
}