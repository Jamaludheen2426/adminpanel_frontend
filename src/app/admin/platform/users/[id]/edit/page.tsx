import { EditUserContent } from "./_components/edit-user-content";

export default async function EditEmployeePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EditUserContent userId={Number(id)} />;
}
