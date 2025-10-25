import Link from "next/link";

async function fetchOrders() {
  const base = process.env.NEXT_PUBLIC_API_BASE!;
  const res = await fetch(`${base}/orders`, { cache: "no-store" });
  if (!res.ok) return { orders: [] };
  return res.json();
}

export default async function Home() {
  const { orders = [] } = await fetchOrders();
  return (
    <main className="max-w-5xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-semibold">sendback — Returns Wallet</h1>
      <p className="text-zinc-600">Upload a receipt to see your orders and return options.</p>
      <div className="grid md:grid-cols-2 gap-4">
        {orders.map((o:any) => (
          <Link key={o.id} href={`/order/${o.id}`} className="rounded-2xl border p-4 hover:shadow">
            <div className="text-sm text-zinc-500">{o.merchant}</div>
            <div className="font-medium">{o.order_id_text}</div>
            <div className="mt-2 text-emerald-700">
              {o.days_remaining >= 0 ? `Due in ${o.days_remaining} days` : `Past due by ${Math.abs(o.days_remaining)} days`}
            </div>
          </Link>
        ))}
      </div>
      <form action="/api/upload" method="post" encType="multipart/form-data" className="border rounded-2xl p-4">
        <label className="block font-medium mb-2">Upload a receipt (png/jpg/pdf/txt)</label>
        <input name="file" type="file" accept=".png,.jpg,.jpeg,.pdf,.txt" className="mb-3" required />
        <button className="px-4 py-2 rounded bg-black text-white">Ingest</button>
      </form>
      <a href="/policy" className="underline">Check a store’s return policy →</a>
    </main>
  );
}
