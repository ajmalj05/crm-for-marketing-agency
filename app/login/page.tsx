import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Logo } from "@/components/logo";
import { LoginForm } from "./login-form";

export const metadata = {
  title: "Sign in | Growith Marketing Agency",
  description: "ARM - Agency Resource Management portal",
};

export default async function LoginPage() {
  const isAuth = await getSession();
  if (isAuth) redirect("/dashboard");

  return (
    <div className="login-root min-h-screen bg-gray-100 flex flex-col pb-[env(safe-area-inset-bottom)]">
      <div className="login-inner flex flex-1 items-center justify-center px-4 py-12">
        <div className="login-box w-full max-w-[400px]">
          <div className="login-card rounded-xl border border-gray-200 bg-white px-8 py-10 shadow-sm">
            <div className="login-title text-center mb-8">
              <div className="flex justify-center mb-6">
                <Logo size="md" link={false} />
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
                Sign in
              </h1>
              <p className="login-subtitle mt-2 text-sm text-gray-500">
                Agency Resource Management
              </p>
            </div>
            <LoginForm />
          </div>
          <p className="login-footer mt-6 text-center text-xs text-gray-400">
            © Growith Marketing agency
          </p>
        </div>
      </div>
    </div>
  );
}
