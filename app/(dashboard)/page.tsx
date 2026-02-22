import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold break-words">Welcome to ARM</h1>
      <p className="text-muted-foreground">
        Agency Resource Management — use the sidebar to open Content Calendar,
        Invoicing, Vendors, Ad Accounts, or IT Credentials.
      </p>
      <Button asChild>
        <Link href="/content-calendar">Open Content Calendar</Link>
      </Button>
    </div>
  );
}
