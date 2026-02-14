import { EditRoleContent } from "./_components/edit-role-content";

export default async function EditRolePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EditRoleContent roleId={Number(id)} />;
}
