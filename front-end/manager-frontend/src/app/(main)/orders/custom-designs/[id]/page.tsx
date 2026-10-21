import ManagerDesignRequests from '@/components/customization/ManagerDesignRequests';
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  return <ManagerDesignRequests id={(await params).id} />;
}
