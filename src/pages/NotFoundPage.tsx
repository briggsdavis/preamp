import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <section className="flex flex-col items-start gap-4">
      <h1 className="text-3xl font-bold">404 — Not found</h1>
      <p className="text-gray-600 dark:text-gray-400">
        That page doesn’t exist.
      </p>
      <Link to="/" className="text-sm hover:underline">
        ← Back home
      </Link>
    </section>
  );
}
