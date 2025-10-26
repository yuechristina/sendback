"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Home() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"active" | "history">("active");

  const uploadFormRef = useRef<HTMLFormElement | null>(null);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);

  async function fetchOrders() {
    const base = process.env.NEXT_PUBLIC_API_BASE!;
    const res = await fetch(`${base}/orders`, { cache: "no-store" });
    if (!res.ok) return { orders: [] };
    return res.json();
  }

  useEffect(() => {
    fetchOrders().then((data) => {
      setOrders(data.orders || []);
      setLoading(false);
    });
  }, []);

  const activeOrders = useMemo(
    () =>
      orders
        .filter((o) => o.days_remaining > 0)
        .sort((a, b) => a.days_remaining - b.days_remaining),
    [orders]
  );

  const expiredOrders = useMemo(
    () =>
      orders
        .filter((o) => o.days_remaining <= 0)
        .sort((a, b) => a.days_remaining - b.days_remaining),
    [orders]
  );

  const expiringCount = useMemo(
    () =>
      orders.filter(
        (o) => o.days_remaining > 0 && o.days_remaining <= 7
      ).length,
    [orders]
  );

  const handleAddReceipt = () => router.push("/upload");
  const handleOrderClick = (id: number) => router.push(`/order/${id}`);

  return (
    <main className="min-h-screen bg-muted flex justify-center items-center">
      <div className="w-full max-w-md h-screen bg-card text-card-foreground rounded-t-3xl border border-border shadow-sm flex flex-col overflow-hidden">
        {/* ===== Header ===== */}
        <header className="sticky top-0 bg-card border-b border-border z-10 px-5 pt-5 pb-3 rounded-t-3xl">
          {/* Icons */}
          <div className="flex justify-end items-center gap-2 mb-2">
            <button className="relative p-2 hover:bg-accent rounded-lg transition-colors">
              {expiringCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {expiringCount}
                </span>
              )}
            </button>
            <button className="p-2 hover:bg-accent rounded-lg transition-colors text-lg">👤</button>
          </div>

          {/* Title */}
          <div className="text-left mb-3 mt-10">
            <h1 className="text-4xl font-bold text-[#252dfa]">sendyback 📦🍃</h1>
            <p className="text-muted-foreground text-sm">Track all your return windows</p>
          </div>

          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search orders or merchants..."
              className="w-full pl-10 pr-4 py-2 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              🔍
            </span>
          </div>
        </header>

        {/* ===== Tabs ===== */}
        <div className="flex gap-4 px-5 border-b border-gray-200 mt-3">
          <button
            onClick={() => setTab("active")}
            className={`py-2 font-medium transition border-b-2 ${
              tab === "active"
                ? "text-[#252dfa] border-[#252dfa]"
                : "text-gray-400 border-transparent hover:text-[#252dfa]"
            }`}
          >
            Active ({activeOrders.length})
          </button>

          <button
            onClick={() => setTab("history")}
            className={`py-2 font-medium transition border-b-2 ${
              tab === "history"
                ? "text-[#252dfa] border-[#252dfa]"
                : "text-gray-400 border-transparent hover:text-[#582630]"
            }`}
          >
            History ({expiredOrders.length})
          </button>
        </div>

        {/* ===== Content ===== */}
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {loading ? (
            <div className="text-center text-muted-foreground py-10">
              Loading orders...
            </div>
          ) : tab === "active" ? (
            activeOrders.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-muted-foreground mb-4">
                  No active returns to track
                </div>
                <button
                  onClick={handleAddReceipt}
                  className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90 transition-colors"
                >
                  + Add Your First Receipt
                </button>
              </div>
            ) : (
              <div className="space-y-3 p-5">
                {activeOrders.map((o) => (
                  <div
                    key={o.id}
                    onClick={() => handleOrderClick(o.id)}
                    className="rounded-2xl border border-border bg-card text-card-foreground p-4 shadow-sm cursor-pointer hover:shadow transition"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <h3 className="font-medium">{o.merchant}</h3>
                      <span
                        className={`text-xs px-3 py-1 rounded-full ${
                          o.days_remaining <= 7
                            ? "bg-destructive/10 text-destructive"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {o.days_remaining} days left
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Order #{o.order_id_text || o.id}
                    </p>
                    {o.purchase_date && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Purchased: {o.purchase_date}
                      </p>
                    )}
                    {o.deadline && (
                      <p className="text-sm text-muted-foreground">
                        Deadline: {o.deadline}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )
          ) : expiredOrders.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
              Nothing yet!
            </div>
          ) : (
            <div className="space-y-3 p-5">
              {expiredOrders.map((o) => (
                <div
                  key={o.id}
                  onClick={() => handleOrderClick(o.id)}
                  className="rounded-2xl border border-border bg-card text-card-foreground p-4 shadow-sm cursor-pointer hover:shadow transition"
                >
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="font-medium">{o.merchant}</h3>
                    <span className="text-xs px-3 py-1 rounded-full bg-muted text-muted-foreground">
                      Expired
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Order #{o.order_id_text || o.id}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Policy link */}
          <div className="mt-4 text-center pb-24">
            <Link href="/policy" className="underline text-primary text-sm">
              Check a store’s return policy →
            </Link>
          </div>
        </div>

        {/* ===== Floating + Button ===== */}
        <button
          onClick={handleAddReceipt}
          className="fixed bottom-24 right-6 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg text-3xl flex items-center justify-center hover:opacity-90 transition"
        >
          +
        </button>
      </div>
    </main>
  );
}
