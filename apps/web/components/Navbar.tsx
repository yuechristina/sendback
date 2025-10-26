"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { href: "/", icon: "🏠", label: "Home" },
    { href: "/upload", icon: "📩", label: "Upload" },
    { href: "/policy", icon: "🔍", label: "Policy" },
    { href: "/profile", icon: "👤", label: "Profile" },
  ];

  return (
    <footer className="fixed bottom-0 left-0 w-full max-w-md bg-card border-t border-border flex justify-around py-2 text-xs z-50">
      {navItems.map((item) => {
        const isActive =
          pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center transition ${
              isActive ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            <span className="mt-1">{item.label}</span>
          </Link>
        );
      })}
    </footer>
  );
}
