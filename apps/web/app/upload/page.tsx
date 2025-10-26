"use client";

import { useRouter } from "next/navigation";
import { UploadReceipt } from "../../components/UploadReceipt";


export default function UploadPage() {
  const router = useRouter();

  const handleUploadComplete = () => {
    // After upload, go back to the home dashboard
    router.push("/");
  };

  return (
    <main className="flex-1 overflow-y-auto no-scrollbar">
      <UploadReceipt onUploadComplete={handleUploadComplete} />
    </main>
  );
}
