"use client";

import { useRef, useState } from "react";

interface UploadReceiptProps {
  onUploadComplete?: () => void;
}

interface UploadResult {
  ok: boolean;
  order?: {
    id: number;
    merchant: string;
    order_id_text: string;
    purchase_date: string;
    deadline_date: string;
    days_remaining: number;
  };
}

export function UploadReceipt({ onUploadComplete }: UploadReceiptProps) {
  const uploadFormRef = useRef<HTMLFormElement | null>(null);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);

  const photoFormRef = useRef<HTMLFormElement | null>(null);
  const photoInputRef = useRef<HTMLInputElement | null>(null);

  const [result, setResult] = useState<UploadResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setResult(null);
    setError(null);
  };

  const handleUpload = (method: string) => {
    if (method === "upload") {
      uploadInputRef.current?.click();
    } else if (method === "photo") {
      photoInputRef.current?.click(); // open camera
    } else {
      // simulate "scan email"
      setTimeout(() => {
        onUploadComplete?.();
      }, 1500);
    }
  };

  async function handleSubmit(form: HTMLFormElement) {
    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData(form);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error(err);
      setError("Failed to upload image. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 p-5">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold">Add a Receipt</h2>
        <p className="text-muted-foreground text-sm">
          We'll extract the details and track your return window automatically.
        </p>
      </div>

      {!result && (
        <div className="space-y-3">
          {/* --- Take Photo --- */}
          <div
            className="bg-card border border-border rounded-xl p-4 hover:bg-accent transition-colors cursor-pointer"
            onClick={() => handleUpload("photo")}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-xl">
                📷
              </div>
              <div className="flex-1 text-left">
                <div className="font-medium">Take Photo</div>
                <div className="text-sm text-muted-foreground">
                  Snap a picture of your receipt
                </div>
              </div>
            </div>
          </div>

          {/* Hidden camera input */}
          <form
            ref={photoFormRef}
            encType="multipart/form-data"
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit(photoFormRef.current!);
            }}
          >
            <input
              ref={photoInputRef}
              name="file"
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={() => photoFormRef.current?.requestSubmit()}
            />
          </form>

          {/* --- Upload File --- */}
          <div className="bg-card border border-border rounded-xl p-4 transition-colors">
            <form
              ref={uploadFormRef}
              encType="multipart/form-data"
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit(uploadFormRef.current!);
              }}
              className="space-y-2"
            >
              <div
                className="flex items-center gap-4 cursor-pointer hover:bg-accent p-2 rounded-lg transition"
                onClick={() => uploadInputRef.current?.click()}
              >
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-xl">
                  📄
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium">Upload File</div>
                  <div className="text-sm text-muted-foreground">
                    PDF, JPG, or PNG receipt
                  </div>
                </div>
              </div>

              <input
                ref={uploadInputRef}
                name="file"
                type="file"
                accept=".png,.jpg,.jpeg,.pdf,.txt"
                className="hidden"
                onChange={() => uploadFormRef.current?.requestSubmit()}
              />
            </form>
          </div>

          {/* --- Scan Email --- */}
          <div
            className="bg-card border border-border rounded-xl p-4 hover:bg-accent transition-colors cursor-pointer"
            onClick={() => handleUpload("email")}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-xl">
                ✉️
              </div>
              <div className="flex-1 text-left">
                <div className="font-medium">Scan Email</div>
                <div className="text-sm text-muted-foreground">
                  Auto-detect receipts from inbox
                </div>
              </div>
            </div>
          </div>

          {loading && (
            <div className="text-center text-sm text-muted-foreground">
              Uploading...
            </div>
          )}
        </div>
      )}

      {/* --- Results Card --- */}
      {result && result.ok && result.order && (
        <div className="border border-border rounded-2xl bg-card p-6 shadow-sm space-y-4 animate-fade-in">
          <h3 className="text-xl font-semibold">✅ Receipt Processed</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Merchant</div>
              <div className="font-medium">{result.order.merchant}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Order ID</div>
              <div className="font-medium">{result.order.order_id_text}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Purchase Date</div>
              <div>{result.order.purchase_date}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Return Deadline</div>
              <div>{result.order.deadline_date}</div>
            </div>
          </div>

          <div className="mt-3">
            <span
              className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${
                result.order.days_remaining > 0
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-destructive/10 text-destructive"
              }`}
            >
              {result.order.days_remaining > 0
                ? `${result.order.days_remaining} days left`
                : `Past due by ${Math.abs(result.order.days_remaining)} days`}
            </span>
          </div>

          <button
            onClick={reset}
            className="mt-4 w-full py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition"
          >
            Upload Another Receipt
          </button>
        </div>
      )}

      {error && (
        <div className="border border-destructive bg-destructive/10 text-destructive rounded-lg p-4">
          {error}
        </div>
      )}
    </div>
  );
}
