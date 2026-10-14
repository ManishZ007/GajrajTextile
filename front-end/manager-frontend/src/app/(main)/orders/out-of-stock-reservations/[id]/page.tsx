import ReservationView from '@/components/reservations/ReservationView';
export default async function Page({ params }: { params: Promise<{ id: string }> }) { return <ReservationView staff outOfStock id={(await params).id} />; }
