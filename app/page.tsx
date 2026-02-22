import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function RootPage() {
  const isAuth = await getSession();
  if (!isAuth) redirect("/login");
  redirect("/dashboard");
}
