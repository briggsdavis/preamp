import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";

import { btn } from "@/admin/ui";
import { useDialogs } from "@/admin/dialogs";

type MenuPageRow = {
  slug: string;
  title: string;
  eyebrow: string;
  builtIn: boolean;
};

export function MenuPages({
  onNavigate,
}: {
  onNavigate: (section: string) => void;
}) {
  const pages = useQuery(api.menu.listMenuPages) as MenuPageRow[] | undefined;
  const createMenuPage = useMutation(api.menu.createMenuPage);
  const { prompt } = useDialogs();

  async function addPage() {
    const title = await prompt({
      title: "New menu page",
      placeholder: "Lunch Specials",
    });
    const cleanTitle = title?.trim();
    if (!cleanTitle) return;
    const eyebrow = await prompt({
      title: "Eyebrow text",
      placeholder: "From the counter",
    });
    const created = await createMenuPage({
      title: cleanTitle,
      eyebrow: eyebrow?.trim() || "Menu",
    });
    onNavigate(`menu-${created.slug}`);
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl text-espresso">Menu Pages</h1>
          <p className="mt-1 text-sm text-espresso/60">
            Create a new menu page, then add sections and items to it.
          </p>
        </div>
        <button type="button" className={btn.primary} onClick={() => void addPage()}>
          + Menu Page
        </button>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {(pages ?? []).map((page) => (
          <button
            key={page.slug}
            type="button"
            onClick={() => onNavigate(`menu-${page.slug}`)}
            className="rounded-2xl border-2 border-sand bg-cream p-5 text-left transition-colors hover:border-gold"
          >
            <p className="font-display text-2xl text-espresso">{page.title}</p>
            <p className="mt-1 font-groovy text-xs uppercase tracking-[0.22em] text-terracotta">
              {page.eyebrow}
            </p>
            <p className="mt-3 text-xs text-espresso/50">/menu/{page.slug}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
