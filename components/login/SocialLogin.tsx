import { Globe, User } from "lucide-react";

export function SocialLogin() {
  return (
    <div className="grid grid-cols-2 gap-4">
      <button
        type="button"
        className="flex items-center justify-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-2.5 text-sm font-medium text-zinc-900 dark:text-zinc-100 shadow-sm transition-all hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 active:scale-[0.98]"
      >
        <User className="h-4 w-4" />
        GitHub
      </button>
      <button
        type="button"
        className="flex items-center justify-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-2.5 text-sm font-medium text-zinc-900 dark:text-zinc-100 shadow-sm transition-all hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 active:scale-[0.98]"
      >
        <Globe className="h-4 w-4 text-blue-500" />
        Google
      </button>
    </div>
  );
}
