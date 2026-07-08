import { AppShell } from "@/components/AppShell";
import { AuthProvider } from "@/lib/auth-context";

export default function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <AppShell>{children}</AppShell>
    </AuthProvider>
  );
}
