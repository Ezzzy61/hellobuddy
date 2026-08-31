import { Suspense } from "react";
import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-cream-50 px-6 py-12">
      <div className="absolute left-6 top-6">
        <Link href="/" className="flex items-center gap-2 text-ink-500 hover:text-ink-900">
          <span className="text-lg">👋</span>
          <span className="font-serif font-semibold">HelloBuddy</span>
        </Link>
      </div>
      <Suspense>
        <AuthForm mode="login" />
      </Suspense>
    </div>
  );
}
