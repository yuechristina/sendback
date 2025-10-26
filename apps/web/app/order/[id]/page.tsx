import { notFound } from "next/navigation";
import OrderReturnFlow from "./return-flow";

async function getAll(id: string) {
  const base = process.env.NEXT_PUBLIC_API_BASE!;
  const safe = encodeURIComponent(id);

  const [oRes, itemsRes, eligRes, optsRes] = await Promise.all([
    fetch(`${base}/order/${safe}`, { cache: "no-store" }),
    fetch(`${base}/order/${safe}/items`, { cache: "no-store" }),
    fetch(`${base}/order/${safe}/eligibility`, { cache: "no-store" }),
    fetch(`${base}/order/${safe}/options`, { cache: "no-store" }),
  ]);

  if (!oRes.ok) notFound();

  const order = await oRes.json();

  const items =
    itemsRes.ok ? (await itemsRes.json()).items ?? [] : [];

  let eligibility = { ok: false, reason: "Unknown" as string };
  if (eligRes.ok) {
    try {
      eligibility = (await eligRes.json()) ?? eligibility;
    } catch {
      /* keep default */
    }
  } else {
    // capture server error text (trim to keep it tidy)
    const t = await eligRes.text().catch(() => "");
    if (t) eligibility = { ok: false, reason: t.slice(0, 120) };
  }

  const options =
    optsRes.ok ? (await optsRes.json()).options ?? [] : [];

  return { order, items, eligibility, options };
}


export default async function OrderPage({
  params,
}: {
  params: Promise<{ id?: string }>;
}) {
  const { id } = await params;
  if (!id || id === "undefined") notFound();

  const { order, items, eligibility, options } = await getAll(id);

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6 min-h-dvh overflow-y-auto">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold">
          {order.merchant} — {order.order_id_text}
        </h1>
        <div className="text-zinc-600">
          Return by <strong>{order.deadline_date}</strong>
        </div>
      </header>

      <OrderReturnFlow
        orderId={order.id}
        eligibility={eligibility}
        items={items}
        options={options}
        apiBase={process.env.NEXT_PUBLIC_API_BASE!}
      />
    </main>
  );
}
