"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export function AboutHeader() {
  return (
    <header className="p-4 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-sm border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between sticky top-0 z-20 transition-colors duration-500">
      <div className="flex items-center gap-4">
        <Link 
          href="/" 
          className="p-2 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors group"
          title="Back to Board"
        >
          <ArrowLeft className="h-5 w-5 text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100" />
        </Link>
        <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">About Kanban</h1>
      </div>
      <ThemeToggle />
    </header>
  );
}
