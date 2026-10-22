import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/app/providers/use-auth";
import { Button } from "@/components/ui/button";
import { ApprovalQueue } from "./components/ApprovalQueue";
import { RequestRoutingBoard } from "./components/RequestRoutingBoard";

type AdminTab = "approvals" | "requests";

export function AdminDashboard() {
  const [tab, setTab] = useState<AdminTab>("approvals");
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  return (
    <main dir="rtl" className="min-h-screen bg-muted/40">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div><p className="text-xs font-semibold text-brand-600">UGC Marketplace</p><h1 className="text-xl font-bold">لوحة الإدارة</h1></div>
          <div className="flex items-center gap-3"><span className="hidden text-sm text-muted-foreground sm:block">{user?.name}</span><Button variant="outline" onClick={() => { signOut(); navigate("/"); }}>تسجيل الخروج</Button></div>
        </div>
      </header>
      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-7 flex gap-2">
          <Button variant={tab === "approvals" ? "default" : "outline"} onClick={() => setTab("approvals")}>مراجعة الأعمال</Button>
          <Button variant={tab === "requests" ? "default" : "outline"} onClick={() => setTab("requests")}>توجيه الطلبات ومراجعة التسليمات</Button>
        </div>
        {tab === "approvals" ? <ApprovalQueue /> : <RequestRoutingBoard />}
      </section>
    </main>
  );
}