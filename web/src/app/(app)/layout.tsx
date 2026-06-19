import { AppHeader } from "@/components/app-header";
import { MobileNav } from "@/components/mobile-nav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-canvas">
      <AppHeader />
      <main className="pb-20 sm:pb-0">{children}</main>
      <MobileNav />
    </div>
  );
}
