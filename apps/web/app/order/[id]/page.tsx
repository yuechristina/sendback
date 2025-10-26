import { notFound } from "next/navigation";

async function getOrder(id: string) {
  const base = process.env.NEXT_PUBLIC_API_BASE;
  if (!base) throw new Error("NEXT_PUBLIC_API_BASE is not set");

  const [oRes, optRes] = await Promise.all([
    fetch(`${base}/order/${id}`, { cache: "no-store" }),
    fetch(`${base}/order/${id}/options`, { cache: "no-store" }),
  ]);

  if (!oRes.ok) {
    // If the order itself isn't found/ok, 404 the page
    notFound();
  }

  const order = await oRes.json();

  let options: any[] = [];
  if (optRes.ok) {
    try {
      const j = await optRes.json();
      options = Array.isArray(j?.options) ? j.options : [];
    } catch {
      options = [];
    }
  } // if options call fails (422/500), just show no options

  return { order, options };
}

export default async function OrderPage({
  params,
}: {
  params: { id?: string };
}) {
  const id = params?.id;
  if (!id || id === "undefined") {
    // Guard against bad params (prefetch/edge dev quirks)
    notFound();
  }

  const { order, options } = await getOrder(id);

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-xl font-semibold">
        {order.merchant} — {order.order_id_text}
      </h1>
      <div className="text-zinc-600">
        Return by <strong>{order.deadline_date}</strong>
      </div>

      <div className="grid gap-3">
        {options.length === 0 ? (
          <div className="text-sm text-zinc-500">
            No return options available for this merchant.
          </div>
        ) : (
          options.map((op: any) => (
            <form
              key={op.id}
              action={`/api/action/${op.id}`}
              method="post"
              className="p-4 border rounded-2xl"
            >
              <div className="font-medium">{op.label}</div>
              <input type="hidden" name="order_id" value={order.id} />
              <button className="mt-2 px-3 py-1.5 rounded bg-black text-white">
                {op.cta}
              </button>
            </form>
          ))
        )}
      </div>

      <section className="p-4 border rounded-2xl">
        <h2 className="font-medium mb-2">What to bring</h2>
        <ul className="list-disc ml-5 text-sm">
          <li>Return QR / label (if provided)</li>
          <li>Order email or ID</li>
          <li>Original packaging if required</li>
          <li>Valid ID (some stores)</li>
          <li>Items clean &amp; unworn</li>
        </ul>
      </section>
    </main>
  );
}
