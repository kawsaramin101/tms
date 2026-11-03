import { AuthGuard } from "@/components/shared/auth-guard";
import { Navbar } from "@/components/layout/Navbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <Navbar />
      <main className="mx-auto w-full max-w-6xl px-4 py-8">{children}</main>
    </AuthGuard>
  );
}
