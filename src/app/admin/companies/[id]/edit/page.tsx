import { EditCompanyContent } from "./_components/edit-company-content";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EditCompanyContent companyId={Number(id)} />;
}
