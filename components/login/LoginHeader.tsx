import { Kanban } from "lucide-react";

export function LoginHeader() {
  return (
    <div className="flex flex-col items-center space-y-2 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-lg shadow-zinc-200 dark:shadow-black/20">
        <Kanban className="h-6 w-6" />
      </div>
      <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
        Welcome back
      </h1>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Enter your credentials to access your workspace
      </p>
    </div>
  );
}
