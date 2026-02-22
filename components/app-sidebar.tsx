"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/logo";
import {
  Calendar,
  FileText,
  Users,
  UserCog,
  BarChart3,
  Server,
  Menu,
  LogOut,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { logoutAction } from "@/app/logout/actions";

const navItems = [
  { href: "/clients", label: "Clients", icon: Building2 },
  { href: "/content-calendar", label: "Production Hub", icon: Calendar },
  { href: "/invoices", label: "Financials", icon: FileText },
  { href: "/vendors", label: "Outsourcing Manager", icon: Users },
  { href: "/vendors/manage", label: "Manage Vendors", icon: UserCog },
  { href: "/ad-accounts", label: "Ads Monitor", icon: BarChart3 },
  { href: "/it-credentials", label: "IT Vault", icon: Server },
];

function NavLinks({ onLinkClick }: { onLinkClick?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onLinkClick}
            className={cn(
              "flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-[hsl(var(--primary))]/15 text-[hsl(var(--primary))]"
                : "text-[hsl(var(--muted-foreground))] hover:bg-secondary/50 hover:text-black"
            )}
          >
            <Icon className="h-5 w-5 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarBrand() {
  return <Logo size="sm" link />;
}

export function AppSidebar() {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-shrink-0 border-r border-[hsl(var(--border))] bg-white md:block">
        <div className="flex h-full flex-col gap-2 px-3 py-4">
          <div className="px-2">
            <SidebarBrand />
            <p className="mt-0.5 text-xs text-[hsl(var(--muted-foreground))]">
              Marketing agency · ARM
            </p>
          </div>
          <Separator />
          <NavLinks />
          <div className="mt-auto pt-4">
            <Separator className="mb-4" />
            <form action={logoutAction}>
              <Button
                type="submit"
                variant="ghost"
                className="w-full justify-start gap-3 text-[hsl(var(--muted-foreground))] hover:text-black"
              >
                <LogOut className="h-5 w-5" />
                Log out
              </Button>
            </form>
          </div>
        </div>
      </aside>
      {/* Mobile: hamburger + sheet */}
      <div className="flex items-center justify-between border-b border-[hsl(var(--border))] bg-white px-4 py-3 md:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <SheetHeader className="border-b border-[hsl(var(--border))] p-4 text-left">
              <SheetTitle className="text-black">
                <SidebarBrand />
              </SheetTitle>
            </SheetHeader>
            <div className="flex flex-col p-4">
              <NavLinks onLinkClick={() => setOpen(false)} />
              <Separator className="my-4" />
              <form action={logoutAction}>
                <Button
                  type="submit"
                  variant="ghost"
                  className="w-full justify-start gap-3"
                  onClick={() => setOpen(false)}
                >
                  <LogOut className="h-5 w-5" />
                  Log out
                </Button>
              </form>
            </div>
          </SheetContent>
        </Sheet>
        <SidebarBrand />
      </div>
    </>
  );
}
