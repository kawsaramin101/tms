import { Suspense } from "react";
import { LoginForm } from "@/modules/auth/components/login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <h1 className="font-serif text-2xl font-semibold text-foreground">
          Sign in to Vault
        </h1>
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
