"use client";
import { useState } from "react";

export default function PolicyPage(){
  const [merchant,setMerchant]=useState(""); 
  const [result,setResult]=useState<any>(null);
  return (
    <main className="max-w-2xl mx-auto p-6 space-y-4">
      <h1 className="text-xl font-semibold">Check a store’s return policy</h1>
      <form onSubmit={async e=>{
        e.preventDefault();
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/policy?merchant=${encodeURIComponent(merchant)}`);
        setResult(await res.json());
      }} className="flex gap-2">
        <input value={merchant} onChange={e=>setMerchant(e.target.value)} placeholder="e.g., Target" className="border rounded px-3 py-2 flex-1"/>
        <button className="px-4 py-2 rounded bg-black text-white">Check</button>
      </form>
      {result && (
        <pre className="p-3 bg-zinc-50 rounded">{JSON.stringify(result.policy, null, 2)}</pre>
      )}
    </main>
  );
}
