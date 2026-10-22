import { Link, useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { useAuth } from "@/app/providers/use-auth";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  return (
    <header className="absolute inset-x-0 top-0 z-20 border-b border-white/10 bg-ink-950/50 text-white backdrop-blur">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8" aria-label="Main navigation">
        <Link to="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500"><Sparkles size={18} /></span>
          UGC Marketplace
        </Link>
        <div className="flex items-center gap-3">
          <a href="#how-it-works" className="hidden text-sm text-white/75 hover:text-white sm:block">كيف تعمل المنصة</a>
          {user ? (
            <Button variant="outline" className="border-white/20 bg-white/10 text-white hover:bg-white/20" onClick={() => { signOut(); navigate("/"); }}>تسجيل الخروج</Button>
          ) : (
            <Button className="rounded-full" onClick={() => navigate("/auth")}>ابدأ الآن</Button>
          )}
        </div>
      </nav>
    </header>
  );
}