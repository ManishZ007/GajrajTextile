import CustomerCustomizer from '@/components/customization/CustomerCustomizer';
export default async function Page({ params }: { params: Promise<{ productId: string }> }) {
  return <CustomerCustomizer productId={(await params).productId} />;
}
