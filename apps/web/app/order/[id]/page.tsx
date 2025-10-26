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
    <main className="max-w-3xl mx-auto p-6 space-y-4 mt-15">
      <h1 className="text-xl font-semibold  text-[#252dfa]">
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
              className="rounded-2xl border border-border bg-card text-card-foreground p-4 shadow-sm cursor-pointer hover:shadow transition">

              <div className="font-medium">{op.label}</div>
              <input type="hidden" name="order_id" value={order.id} />
              <button
                type="submit"
                className={`mt-3 text-xs px-3 py-1.5 rounded-full font-medium transition
                  ${
                    order.days_remaining <= 7
                      ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
                      : "bg-muted text-muted-foreground hover:bg-muted/70"
                  }`}
              >
                {op.cta}
              </button>
            </form>
          ))
        )}
      </div>

      <section className="rounded-2xl border border-border bg-card text-card-foreground p-4 shadow-sm cursor-pointer hover:shadow transition">
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
