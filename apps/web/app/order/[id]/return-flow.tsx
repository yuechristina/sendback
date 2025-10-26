"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Item = { id: number; name: string; sku?: string; quantity: number; unit_price: number };
type Option = { id: "mail" | "dropoff"; label: string; cta: string };

export default function OrderReturnFlow(props: {
  orderId: number;
  eligibility: { ok: boolean; reason?: string };
  items: Item[];
  options: Option[];
  apiBase: string;
}) {
  const { orderId, eligibility, items, options, apiBase } = props;
  const [selectedItemIds, setSelectedItemIds] = useState<number[]>([]);
  const [method, setMethod] = useState<"mail" | "dropoff" | "">("");
  const router = useRouter();

  const subtotal = useMemo(
    () =>
      items
        .filter(i => selectedItemIds.includes(i.id))
        .reduce((s, i) => s + i.unit_price * i.quantity, 0),
    [items, selectedItemIds]
  );

  const toggleItem = (id: number) =>
    setSelectedItemIds((prev) =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );

  async function onStart() {
    if (!eligibility.ok) return; // button disabled anyway
    // advance to step 2 visually (no server needed); we’ll let the user pick items
    document.getElementById("step-2")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function onSubmit() {
    if (!method || selectedItemIds.length === 0) return;
    const res = await fetch(`${apiBase}/order/${orderId}/initiate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ item_ids: selectedItemIds, method }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err?.detail || "Could not initiate return.");
      return;
    }
    const j = await res.json();
    if (j?.next) router.push(j.next);
  }

  return (
    <div className="space-y-8">
      {/* Step 1: Start / reason why not */}
      <section className="p-4 border rounded-2xl" id="step-1">
        <h2 className="font-medium mb-2">1) Start a return</h2>
        {eligibility.ok ? (
          <button
            onClick={onStart}
            className="px-3 py-1.5 rounded bg-black text-white"
          >
            Start return
          </button>
        ) : (
          <div className="text-sm text-red-600">
            Cannot start a return — {eligibility.reason || "Unknown reason"}
          </div>
        )}
      </section>

      {/* Step 2: Select items */}
      <section className="p-4 border rounded-2xl" id="step-2" aria-disabled={!eligibility.ok}>
        <h2 className="font-medium mb-3">2) Choose items to return</h2>
        <div className="grid gap-2">
          {items.map((it) => (
            <label key={it.id} className="flex items-center gap-3 p-3 border rounded-xl">
              <input
                type="checkbox"
                disabled={!eligibility.ok}
                checked={selectedItemIds.includes(it.id)}
                onChange={() => toggleItem(it.id)}
              />
              <div className="flex-1">
                <div className="font-medium">{it.name}</div>
                <div className="text-xs text-zinc-500">
                  {it.quantity} × ${it.unit_price.toFixed(2)}
                  {it.sku ? ` • SKU ${it.sku}` : ""}
                </div>
              </div>
            </label>
          ))}
        </div>
        <div className="mt-2 text-sm text-zinc-600">
          Estimated subtotal: <strong>${subtotal.toFixed(2)}</strong>
        </div>
      </section>

      {/* Step 3: Method */}
      <section className="p-4 border rounded-2xl" id="step-3" aria-disabled={!eligibility.ok}>
        <h2 className="font-medium mb-3">3) Pick a return method</h2>
        {options.length === 0 ? (
          <div className="text-sm text-zinc-500">
            No return options available for this merchant.
          </div>
        ) : (
          <div className="grid gap-2">
            {options.map((op) => (
  <div key={op.id} className="flex items-center gap-3 p-3 border rounded-xl">
    {"url" in op ? (
      <a
        href={op.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-1"
      >
        <div className="font-medium">{op.label}</div>
        <div className="text-xs text-zinc-500">{op.cta}</div>
      </a>
    ) : (
      <label className="flex-1 flex items-center gap-2">
        <input
          type="radio"
          name="method"
          value={op.id}
          checked={method === op.id}
          onChange={() => setMethod(op.id as "mail" | "dropoff")}
          disabled={!eligibility.ok}
        />
        <div>
          <div className="font-medium">{op.label}</div>
          <div className="text-xs text-zinc-500">{op.cta}</div>
        </div>
      </label>
    )}
  </div>
))}

          </div>
        )}

        <button
          onClick={onSubmit}
          disabled={!eligibility.ok || selectedItemIds.length === 0 || !method}
          className="mt-3 px-3 py-1.5 rounded bg-black text-white disabled:opacity-50"
        >
          Continue
        </button>
      </section>
    </div>
  );
}
