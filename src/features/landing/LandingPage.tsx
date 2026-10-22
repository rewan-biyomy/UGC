import { Navbar } from "./components/Navbar";
import { Hero } from "./components/Hero";

const currentYear = new Date().getFullYear();

export function LandingPage() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <footer className="bg-ink-950 px-6 py-7 text-center text-sm text-white/50">© {currentYear} UGC Marketplace. ننسّق كل طلب بعناية.</footer>
    </main>
  );
}