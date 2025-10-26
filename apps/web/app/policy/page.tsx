"use client";
import { useState } from "react";

export default function PolicyPage() {
  const [merchant, setMerchant] = useState("");
  const [result, setResult] = useState<any>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE}/policy?merchant=${encodeURIComponent(merchant)}`
    );
    setResult(await res.json());
  }

  return (
    <main className="min-h-screen bg-muted flex justify-center items-left ">
      <div className="w-full max-w-md h-screen bg-card text-card-foreground rounded-t-3xl border border-border shadow-sm flex flex-col overflow-hidden">
        {/* ===== Header ===== */}
        <header className="sticky top-0 bg-card border-b border-border z-10 px-5 pt-6 pb-3 rounded-t-3xl">
          <h1 className="text-2xl font-bold text-[#252dfa] mt-15">
            Check a Store’s Return Policy
          </h1>
          <p className="text-sm text-muted-foreground">
            Find return windows and requirements by store.
          </p>
        </header>

        {/* ===== Content ===== */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-5 space-y-5">
          {/* Search Form */}
          <form
            onSubmit={handleSearch}
            className="flex items-center gap-3 w-full mt-4"
          >
            <div className="relative flex-1">
              <input
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
                placeholder="Search store (e.g., Target)"
                className="w-full pl-10 pr-4 py-2 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                🔍
              </span>
            </div>

            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-[#252dfa] text-white font-medium hover:opacity-90 transition"
            >
              Check
            </button>
          </form>

          {/* Results */}
          {result && result.policy && (
            <div className="mt-5 border border-border rounded-xl bg-card shadow-sm p-4">
              <h2 className="font-semibold mb-3 text-[#252dfa]">
                Return Policy Details
              </h2>

              <ul className="space-y-2 text-sm">
                {Object.entries(result.policy).map(([key, value]) => (
                  <li
                    key={key}
                    className="flex justify-between items-start border-b border-border/50 pb-2 last:border-0"
                  >
                    <span className="font-medium text-foreground capitalize">
                      {key.replace(/_/g, " ")}
                    </span>
                    <span className="text-muted-foreground text-right">
                      {String(value) || "—"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

        </div>

      </div>
    </main>
  );
}
