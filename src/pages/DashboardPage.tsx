import { useState, type FormEvent } from "react";
import { useQuery, useMutation } from "convex/react";

import { api } from "@convex/_generated/api";
import { Button } from "@/components/ui/Button";

/**
 * Example of reading and writing Convex data from a protected page.
 * `useQuery` subscribes in real time; `useMutation` writes back.
 */
export function DashboardPage() {
  const messages = useQuery(api.messages.list);
  const sendMessage = useMutation(api.messages.send);
  const [draft, setDraft] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.trim()) return;
    await sendMessage({ body: draft.trim() });
    setDraft("");
  }

  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Write a message…"
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
        />
        <Button type="submit">Send</Button>
      </form>

      <ul className="flex flex-col gap-2">
        {messages === undefined && (
          <li className="text-sm text-gray-500">Loading messages…</li>
        )}
        {messages?.length === 0 && (
          <li className="text-sm text-gray-500">No messages yet.</li>
        )}
        {messages?.map((message) => (
          <li
            key={message._id}
            className="rounded-md border border-gray-200 px-3 py-2 text-sm dark:border-gray-800"
          >
            {message.body}
          </li>
        ))}
      </ul>
    </section>
  );
}
