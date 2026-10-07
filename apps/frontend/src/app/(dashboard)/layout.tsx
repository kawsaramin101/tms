import { AuthGuard } from "@/components/shared/auth-guard";
import { Navbar } from "@/components/layout/Navbar";
import { LogoutButton } from "@/modules/auth/components/logout-button";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <Navbar />
      <div className="mx-auto flex w-full max-w-6xl justify-end px-4 pt-4">
        <LogoutButton />
      </div>
      <main className="mx-auto w-full max-w-6xl px-4 py-8">{children}</main>
    </AuthGuard>
  );
}
