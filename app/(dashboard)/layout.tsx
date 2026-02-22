import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AppSidebar } from "@/components/app-sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isAuth = await getSession();
  if (!isAuth) redirect("/login");

  return (
    <div className="min-h-screen bg-white">
      <AppSidebar />
      <main className="min-w-0 overflow-x-hidden md:pl-64">
        <div className="p-4 md:p-6">{children}</div>
      </main>
    </div>
  );
}
