import "./globals.css";
import Navbar from "@/components/Navbar";
import BackgroundMusic from "@/components/BackgroundMusic";

export const metadata = {
  title: "SendBack",
  description: "Returns Wallet Dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="bg-background text-foreground">
      {/* Make body relative so fixed elements position correctly */}
      <body className="min-h-screen flex justify-center bg-muted relative">
        {/* This div is your main app container */}
        <div className="w-full max-w-md h-screen bg-card text-card-foreground rounded-t-3xl border border-border shadow-sm overflow-hidden flex flex-col">
          {children}
          <Navbar />
        </div>

        {/* 👇 Move this outside to avoid being hidden by overflow-hidden */}
        <BackgroundMusic />
      </body>
    </html>
  );
}
