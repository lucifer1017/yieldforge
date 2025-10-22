"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Home, Zap, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

export function Navigation() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const navItems = [
    {
      href: "/",
      label: "Home",
      icon: Home,
    },
    {
      href: "/intent",
      label: "Intent Builder",
      icon: Zap,
    },
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: BarChart3,
    },
  ];

  if (!mounted) {
    return (
      <nav className="flex space-x-2">
        {navItems.map((item) => (
          <div key={item.href} className="h-8 w-24 bg-muted animate-pulse rounded-md"></div>
        ))}
      </nav>
    );
  }

  return (
    <nav className="flex space-x-2">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        
        return (
          <Link key={item.href} href={item.href}>
            <Button
              variant={isActive ? "default" : "ghost"}
              size="sm"
              className={cn(
                "flex items-center space-x-2",
                isActive && "bg-primary text-primary-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Button>
          </Link>
        );
      })}
    </nav>
  );
}
