import { SignInForm } from "@/features/auth/SignInForm";

export function SignInPage() {
  return (
    <section className="flex flex-col items-center gap-6 py-12">
      <h1 className="text-2xl font-bold">Sign in to Preamp</h1>
      <SignInForm />
    </section>
  );
}
