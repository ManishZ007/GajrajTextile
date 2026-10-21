'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
type Product = { productId: string; name: string; categoryName: string };
export default function Page() {
  const [page, setPage] = useState(0), [pages, setPages] = useState(0), [items, setItems] = useState<Product[]>([]);
  const [error, setError] = useState(''), [loading, setLoading] = useState(true), [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError('');
    fetch(`/api/customization/catalog?page=${page}`, { cache: 'no-store', signal: controller.signal })
      .then(async r => { const d = await r.json(); if (!r.ok) throw Error(d.error); setItems(d.items); setPages(d.totalPages); })
      .catch(e => { if (!controller.signal.aborted) setError(e.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [page, retry]);
  return <main className="max-w-6xl mx-auto px-6 py-12">
    <div className="flex justify-between mb-8"><h1 className="text-3xl font-light">Design your Paithani</h1><Link href="/custom-designs">My design requests</Link></div>
    <p className="mb-8">Choose a starting product, personalize its available colors and designs, then request a quote.</p>
    {error ? <div role="alert">{error}<button className="underline ml-3" onClick={() => setRetry(v => v + 1)}>Retry</button></div>
      : loading ? <p role="status">Loading products…</p> : items.length === 0 ? <p>No customizable products are available yet.</p> :
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">{items.map(p => <Link key={p.productId} className="border p-6" href={`/product/${p.productId}/customize`}>
          <p className="text-sm text-gray-500">{p.categoryName}</p><h2 className="text-xl mt-2">{p.name}</h2><p className="mt-4 underline">Customize</p>
        </Link>)}</div>}
    <div className="flex gap-6 mt-8"><button disabled={page === 0 || loading} onClick={() => setPage(p => p - 1)}>Previous</button>
      <span>Page {page + 1}</span><button disabled={page + 1 >= pages || loading} onClick={() => setPage(p => p + 1)}>Next</button></div>
  </main>;
}
