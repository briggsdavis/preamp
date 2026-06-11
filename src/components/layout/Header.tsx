import { Link } from "react-router-dom";
import { Authenticated, Unauthenticated } from "convex/react";

import { SignOutButton } from "@/components/auth/SignOutButton";

export function Header() {
  return (
    <header className="border-b border-gray-200 dark:border-gray-800">
      <nav className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4">
        <Link to="/" className="text-lg font-semibold">
          Preamp
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <Authenticated>
            <Link to="/dashboard" className="hover:underline">
              Dashboard
            </Link>
            <SignOutButton />
          </Authenticated>
          <Unauthenticated>
            <Link to="/sign-in" className="hover:underline">
              Sign in
            </Link>
          </Unauthenticated>
        </div>
      </nav>
    </header>
  );
}
