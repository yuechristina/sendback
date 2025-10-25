async function getOrder(id:string) {
  const base = process.env.NEXT_PUBLIC_API_BASE!;
  const [o, opts] = await Promise.all([
    fetch(`${base}/order/${id}`, {cache:"no-store"}).then(r=>r.json()),
    fetch(`${base}/order/${id}/options`, {cache:"no-store"}).then(r=>r.json())
  ]);
  return { order:o, options:opts.options };
}

export default async function OrderPage({params}:{params:{id:string}}) {
  const { order, options } = await getOrder(params.id);
  return (
    <main className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-xl font-semibold">{order.merchant} — {order.order_id_text}</h1>
      <div className="text-zinc-600">Return by <strong>{order.deadline_date}</strong></div>
      <div className="grid gap-3">
        {options.map((op:any)=>(
          <form key={op.id} action={`/api/action/${op.id}`} method="post" className="p-4 border rounded-2xl">
            <div className="font-medium">{op.label}</div>
            <input type="hidden" name="order_id" value={order.id}/>
            <button className="mt-2 px-3 py-1.5 rounded bg-black text-white">{op.cta}</button>
          </form>
        ))}
      </div>
      <section className="p-4 border rounded-2xl">
        <h2 className="font-medium mb-2">What to bring</h2>
        <ul className="list-disc ml-5 text-sm">
          <li>Return QR / label (if provided)</li>
          <li>Order email or ID</li>
          <li>Original packaging if required</li>
          <li>Valid ID (some stores)</li>
          <li>Items clean & unworn</li>
        </ul>
      </section>
    </main>
  );
}
