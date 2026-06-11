import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthActions } from "@convex-dev/auth/react";

import { Button } from "@/components/ui/Button";

type Flow = "signIn" | "signUp";

/**
 * Email + password sign-in / sign-up form backed by the Convex Auth
 * `Password` provider. This lives under `features/` because it is a
 * self-contained slice of functionality (UI + behavior) rather than a
 * generic primitive.
 */
export function SignInForm() {
  const { signIn } = useAuthActions();
  const navigate = useNavigate();
  const [flow, setFlow] = useState<Flow>("signIn");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const formData = new FormData(event.currentTarget);
    formData.set("flow", flow);

    try {
      await signIn("password", formData);
      navigate("/dashboard");
    } catch {
      setError("Could not sign in. Check your credentials and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-3">
      <input
        name="email"
        type="email"
        placeholder="Email"
        autoComplete="email"
        required
        className="rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
      />
      <input
        name="password"
        type="password"
        placeholder="Password"
        autoComplete="current-password"
        required
        className="rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" disabled={submitting}>
        {flow === "signIn" ? "Sign in" : "Create account"}
      </Button>

      <button
        type="button"
        onClick={() => setFlow(flow === "signIn" ? "signUp" : "signIn")}
        className="text-sm text-gray-500 hover:underline"
      >
        {flow === "signIn"
          ? "Need an account? Sign up"
          : "Already have an account? Sign in"}
      </button>
    </form>
  );
}
