import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata = {
  title: "SendBack",
  description: "Returns Wallet Dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="bg-background text-foreground">
      <body className="min-h-screen flex justify-center bg-muted">
        <div className="w-full max-w-md h-screen bg-card text-card-foreground rounded-t-3xl border border-border shadow-sm overflow-hidden flex flex-col relative">
          {children}
          <Navbar />
        </div>
      </body>
    </html>
  );
}
