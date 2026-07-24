import { useAuthActions } from "@convex-dev/auth/react"
import { useState, type FormEvent } from "react"

/**
 * Admin sign-in / sign-up screen. Both flows use Convex Auth's password
 * provider. Sign-up only succeeds for emails on the ADMIN_EMAILS allowlist
 * (enforced server-side in convex/auth.ts); the gate's error is shown inline.
 */

const fieldClass =
  "w-full rounded-xl border-2 border-sand bg-white px-4 py-3 text-espresso placeholder:text-espresso/55 outline-none transition-colors focus:border-gold"

export function AuthScreen() {
  const { signIn } = useAuthActions()
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await signIn("password", { email, password, flow })
    } catch (err: unknown) {
      setError(readError(err, flow))
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-espresso px-5">
      <div className="w-full max-w-md rounded-3xl border-2 border-sand/20 bg-cream p-8 shadow-2xl md:p-10">
        <div className="text-center">
          <p className="font-groovy text-sm tracking-[0.35em] text-terracotta uppercase">Pre Amp</p>
          <h1 className="mt-2 font-display text-4xl text-espresso">
            Admin {flow === "signIn" ? "Sign In" : "Sign Up"}
          </h1>
          <p className="mt-2 text-sm text-espresso/65">
            {flow === "signIn"
              ? "Sign in to manage the site."
              : "Create an admin account. Your email must be on the allowlist."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <input
            required
            type="email"
            name="email"
            autoComplete="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={fieldClass}
          />
          <input
            required
            type="password"
            name="password"
            autoComplete={flow === "signIn" ? "current-password" : "new-password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={fieldClass}
          />

          {error && (
            <p className="rounded-xl border border-brick/30 bg-brick/10 px-4 py-3 text-sm text-brick">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-brick px-7 py-3 font-semibold text-cream shadow-lg transition-all hover:-translate-y-0.5 hover:bg-maroon disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "One sec…" : flow === "signIn" ? "Sign In →" : "Create Account →"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-espresso/70">
          {flow === "signIn" ? (
            <>
              Need an admin account?{" "}
              <button
                type="button"
                onClick={() => {
                  setFlow("signUp")
                  setError(null)
                }}
                className="font-semibold text-brick underline-offset-2 hover:underline"
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have one?{" "}
              <button
                type="button"
                onClick={() => {
                  setFlow("signIn")
                  setError(null)
                }}
                className="font-semibold text-brick underline-offset-2 hover:underline"
              >
                Sign in
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/** Pull a friendly message out of a Convex/auth error. */
function readError(err: unknown, flow: "signIn" | "signUp"): string {
  // ConvexError carries its payload on `.data`.
  if (err && typeof err === "object" && "data" in err) {
    const data = (err as { data?: unknown }).data
    if (typeof data === "string" && data.trim()) return data
  }
  return flow === "signIn"
    ? "Couldn't sign in. Check your email and password."
    : "Couldn't create the account. Make sure your email is on the admin allowlist."
}
