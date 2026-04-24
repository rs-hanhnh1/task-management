import { AboutHeader } from "@/components/about/AboutHeader";
import { AboutContent } from "@/components/about/AboutContent";

export default function AboutPage() {
  return (
    <div className="min-h-screen w-full bg-zinc-50 dark:bg-zinc-900 transition-colors duration-500 overflow-y-auto">
      {/* Background Decorative Elements - Matching Login Design */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[25%] -left-[10%] h-[70%] w-[70%] rounded-full bg-zinc-200/40 dark:bg-zinc-800/20 blur-3xl transition-colors duration-500" />
        <div className="absolute -bottom-[20%] -right-[5%] h-[60%] w-[60%] rounded-full bg-zinc-200/40 dark:bg-zinc-800/20 blur-3xl transition-colors duration-500" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <AboutHeader />
        
        <main className="flex-1">
          <div className="py-12 md:py-20 text-center space-y-4">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 px-4">
              Streamline Your <span className="text-zinc-500 italic">Workflow</span>
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 max-w-xl mx-auto px-6">
              Master the art of efficiency with our premium Kanban experience. 
              Visualize, manage, and deliver with zero friction.
            </p>
          </div>

          <AboutContent />

          <footer className="py-20 text-center text-sm text-zinc-400 dark:text-zinc-600">
            © 2026 Kanban Board MVP. All rights reserved.
          </footer>
        </main>
      </div>
    </div>
  );
}
