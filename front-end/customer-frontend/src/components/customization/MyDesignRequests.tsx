'use client';
import DesignRequestsView from './DesignRequestsView';
async function request(path: string) {
  const response = await fetch('/api/design-requests' + path, { cache: 'no-store' });
  const data = await response.json();
  if (!response.ok) throw Error(data.error || 'Could not load your designs');
  return data;
}
export default function MyDesignRequests({ id }: { id?: string }) {
  return <DesignRequestsView id={id} request={request} />;
}
