"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Mail, Lock, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    // UI-only for now: simulate a delay
    await new Promise((resolve) => setTimeout(resolve, 1500));
    console.log("Form submitted:", data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <label
          htmlFor="email"
          className="text-sm font-medium leading-none text-zinc-700 dark:text-zinc-300 peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Email
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
          <input
            {...register("email")}
            id="email"
            type="email"
            placeholder="name@example.com"
            className={cn(
              "flex h-10 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-10 py-2 text-sm ring-offset-white transition-all placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 dark:focus-visible:ring-zinc-300 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
              errors.email && "border-red-500 focus-visible:ring-red-500"
            )}
          />
        </div>
        {errors.email && (
          <p className="text-[0.8rem] font-medium text-red-500">
            {errors.email.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label
            htmlFor="password"
            className="text-sm font-medium leading-none text-zinc-700 dark:text-zinc-300"
          >
            Password
          </label>
          <a
            href="#"
            className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            Forgot password?
          </a>
        </div>
        <div className="relative">
          <Lock className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
          <input
            {...register("password")}
            id="password"
            type="password"
            placeholder="••••••••"
            className={cn(
              "flex h-10 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-10 py-2 text-sm ring-offset-white transition-all placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 dark:focus-visible:ring-zinc-300 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
              errors.password && "border-red-500 focus-visible:ring-red-500"
            )}
          />
        </div>
        {errors.password && (
          <p className="text-[0.8rem] font-medium text-red-500">
            {errors.password.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="relative flex w-full items-center justify-center rounded-xl bg-zinc-900 dark:bg-zinc-100 px-4 py-2.5 text-sm font-medium text-white dark:text-zinc-900 shadow-lg shadow-zinc-200 dark:shadow-black/20 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          "Sign In"
        )}
      </button>
    </form>
  );
}
