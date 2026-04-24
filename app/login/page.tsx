import { LoginHeader } from "@/components/login/LoginHeader";
import { LoginForm } from "@/components/login/LoginForm";
import { SocialLogin } from "@/components/login/SocialLogin";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-zinc-50 dark:bg-zinc-900 p-4 transition-colors duration-500">
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[25%] -left-[10%] h-[70%] w-[70%] rounded-full bg-zinc-200/40 dark:bg-zinc-800/20 blur-3xl transition-colors duration-500" />
        <div className="absolute -bottom-[20%] -right-[5%] h-[60%] w-[60%] rounded-full bg-zinc-200/40 dark:bg-zinc-800/20 blur-3xl transition-colors duration-500" />
      </div>

      <div className="relative z-10 w-full max-w-md transition-all duration-500">
        <div className="overflow-hidden rounded-3xl border border-zinc-200/50 dark:border-zinc-800/50 bg-white/70 dark:bg-zinc-950/70 shadow-2xl shadow-zinc-200/50 dark:shadow-black/50 backdrop-blur-xl">
          <div className="p-8 space-y-8">
            <LoginHeader />
            
            <div className="space-y-6">
              <SocialLogin />
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-zinc-200 dark:border-zinc-800" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white dark:bg-zinc-950 px-2 text-zinc-500 dark:text-zinc-400">
                    Or continue with
                  </span>
                </div>
              </div>

              <LoginForm />
            </div>

            <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">
              Don&apos;t have an account?{" "}
              <a
                href="#"
                className="font-medium text-zinc-900 dark:text-zinc-100 hover:underline underline-offset-4"
              >
                Create an account
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
