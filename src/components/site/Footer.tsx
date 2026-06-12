import { Link } from "react-router-dom";

import { NAV, SITE } from "@/data/site";
import { RippleStripes } from "@/components/site/RippleStripes";
import { Reveal } from "@/components/site/Reveal";

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-espresso text-cream">
      {/* Taller band with breathing room up top so the rippling ovals can
          pulse upward without being clipped at the footer edge. */}
      <div className="absolute inset-x-0 top-0 h-36 pt-5 opacity-40">
        <RippleStripes count={20} fade="none" />
      </div>

      <div className="relative mx-auto grid max-w-7xl gap-10 px-6 pb-12 pt-40 md:grid-cols-4 md:px-8">
        <Reveal className="md:col-span-1">
          <p className="font-display text-3xl text-gold">Pre Amp</p>
          <p className="mt-2 text-sm text-cream/70">
            A coffee-and-vinyl listening bar. Brews & beats, all day.
          </p>
          <a
            href={SITE.instagram}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-block text-sm font-semibold text-amber transition-colors hover:text-gold"
          >
            @preamp.coffeestudio →
          </a>
        </Reveal>

        {NAV.filter((i) => i.children).map((group, gi) => (
          <Reveal key={group.label} delay={0.08 * (gi + 1)}>
            <p className="font-groovy text-sm uppercase tracking-[0.2em] text-amber">
              {group.label}
            </p>
            <ul className="mt-3 space-y-2">
              {group.children!.map((c) => (
                <li key={c.to}>
                  <Link
                    to={c.to}
                    className="text-sm text-cream/75 transition-colors hover:text-gold"
                  >
                    {c.label}
                  </Link>
                </li>
              ))}
            </ul>
          </Reveal>
        ))}

        <Reveal delay={0.24}>
          <p className="font-groovy text-sm uppercase tracking-[0.2em] text-amber">
            Visit
          </p>
          <p className="mt-3 text-sm text-cream/75">{SITE.address}</p>
          <p className="text-sm text-cream/75">{SITE.neighborhood}</p>
          <p className="mt-2 text-sm text-cream/75">{SITE.phone}</p>
        </Reveal>
      </div>

      <div className="relative border-t border-cream/10 py-5 text-center text-xs text-cream/50">
        © {new Date().getFullYear()} Pre Amp Coffee Studio · Pittsburgh, PA
      </div>
    </footer>
  );
}
