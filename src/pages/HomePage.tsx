import { Link } from "react-router-dom";

export function HomePage() {
  return (
    <section className="flex flex-col items-start gap-4">
      <h1 className="text-3xl font-bold">Welcome to Preamp</h1>
      <p className="max-w-prose text-gray-600 dark:text-gray-400">
        A React + Vite + TypeScript app wired up to a Convex backend with
        Convex Auth. Edit <code>src/pages/HomePage.tsx</code> to get started.
      </p>
      <Link
        to="/dashboard"
        className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 dark:bg-white dark:text-gray-900"
      >
        Go to dashboard
      </Link>
    </section>
  );
}
