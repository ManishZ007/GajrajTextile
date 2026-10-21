import MyDesignRequests from '@/components/customization/MyDesignRequests';
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  return <MyDesignRequests id={(await params).id} />;
}
