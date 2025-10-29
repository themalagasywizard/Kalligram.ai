"use client";

import Link from "next/link";
import Image from "next/image";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";

const nav = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#testimonials", label: "Testimonials" },
  { href: "#faq", label: "FAQ" },
];

export function SiteHeader() {
  return (
    <header className="fixed top-[1.75rem] left-1/2 -translate-x-1/2 z-50 w-full max-w-3xl">
      <div className="mx-4 rounded-full border border-white/20 bg-background/60 backdrop-blur-xl shadow-lg supports-[backdrop-filter]:bg-background/40">
        <div className="flex h-14 items-center px-6">
          <div className="mr-4 flex items-center gap-6">
            <Link href="#" className="flex items-center gap-2 font-semibold">
              <Image src="/Logo.png" alt="Kalligram Logo" width={48} height={48} className="rounded" />
              <span className="text-primary">{siteConfig.name}</span>
            </Link>
            <nav className="hidden gap-6 md:flex">
              {nav.map((item) => (
                <Link key={item.href} href={item.href} className={cn("text-sm text-muted-foreground transition-colors hover:text-foreground")}>
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex flex-1 items-center justify-end gap-2">
          <Button asChild className="hidden sm:inline-flex">
            <Link href="/waitlist">Join waitlist</Link>
          </Button>
          <Sheet>
            <SheetTrigger asChild>
              <Button size="icon" variant="outline" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <div className="mt-6 grid gap-4">
                {nav.map((item) => (
                  <Link key={item.href} href={item.href} className="text-sm text-muted-foreground hover:text-foreground">
                    {item.label}
                  </Link>
                ))}
                <Button asChild>
                  <Link href="/waitlist">Join waitlist</Link>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
