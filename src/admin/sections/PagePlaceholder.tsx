/**
 * Placeholder for the page-content editors (Home, About, Global/Footer/
 * Contact). These exist in the nav by request, but their editing UIs are not
 * built yet.
 */
export function PagePlaceholder({ name }: { name: string }) {
  return (
    <div>
      <h1 className="font-display text-4xl text-espresso">{name} Page Editor</h1>
      <div className="mt-8 max-w-xl rounded-2xl border-2 border-dashed border-sand bg-cream p-8 text-center">
        <p className="font-display text-2xl text-espresso/70">Coming soon</p>
        <p className="mt-3 text-espresso/60">
          The content editor for the {name} page hasn't been built yet. The
          section is here so it's ready to wire up later.
        </p>
      </div>
    </div>
  );
}
