"use client";

export default function AddToCalendar({ orderId }: { orderId: number }) {
  const addToCalendar = async () => {
    try {
      const url = `http://localhost:8000/order/${orderId}/calendar`;
      console.log("🔍 Fetching calendar for order:", orderId);

      const response = await fetch(url);
      console.log("📡 Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Error response:", errorText);
        throw new Error(`Failed to generate calendar event: ${response.status}`);
      }

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `return-reminder-${orderId}.ics`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(blobUrl);
      document.body.removeChild(a);

      console.log("✅ Calendar event downloaded successfully!");
    } catch (error) {
      console.error("❌ Error adding to calendar:", error);
      alert(
        "Failed to add event to calendar. Please check the console for details."
      );
    }
  };

  return (
    <section className="rounded-2xl border border-border bg-card text-card-foreground p-4 shadow-sm">
      <h2 className="font-medium mb-2 text-[#252dfa]">
        📅 Add Return Deadline to Calendar
      </h2>
      <p className="text-sm text-muted-foreground mb-3">
        Set a reminder so you don’t miss your return window.
      </p>
      <button
        onClick={addToCalendar}
        className="px-4 py-2 rounded-lg bg-[#252dfa] text-white font-medium hover:opacity-90 transition"
      >
        Add to Calendar
      </button>
    </section>
  );
}
