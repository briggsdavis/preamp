import { Link } from "react-router-dom";

import { NAV } from "@/data/site";
import { RippleStripes } from "@/components/site/RippleStripes";
import { Reveal } from "@/components/site/Reveal";
import { SocialIcon } from "@/components/site/SocialIcons";
import { useTrack } from "@/lib/analytics";
import { useGlobalContent } from "@/lib/siteContent";

export function Footer() {
  const track = useTrack();
  const global = useGlobalContent();
  return (
    <footer className="relative overflow-hidden bg-espresso text-cream">
      {/* Taller band with breathing room up top so the rippling ovals can
          pulse upward without being clipped at the footer edge. */}
      <div className="absolute inset-x-0 top-0 h-36 pt-5 opacity-40">
        <RippleStripes count={110} fade="none" variant="wave" gap={3} />
      </div>

      <div className="relative mx-auto grid max-w-7xl gap-10 px-6 pb-12 pt-56 md:grid-cols-4 md:px-8">
        <Reveal className="md:col-span-1">
          <div className="flex items-center gap-3">
            <img
              src="/images/preamplogo.png"
              alt="Pre Amp logo"
              loading="lazy"
              decoding="async"
              className="h-12 w-12 object-contain"
            />
            <p className="font-display text-3xl text-gold">{global.businessName}</p>
          </div>
          <p className="mt-2 text-sm text-cream/70">
            {global.footerBlurb}
          </p>
          <a
            href={global.orderUrl}
            target="_blank"
            rel="noreferrer"
            onClick={() =>
              track("order_click", {
                clickSource: "footer",
                destination: global.orderUrl,
              })
            }
            className="mt-5 inline-block rounded-full bg-gold px-6 py-2.5 font-semibold text-espresso shadow-lg shadow-black/20 transition-all hover:-translate-y-0.5 hover:bg-amber"
          >
            Order Online →
          </a>
          <div className="mt-5 flex items-center gap-3">
            {global.socials.map((social) => (
              <a
                key={`${social.platform}-${social.url}`}
                href={social.url}
                target="_blank"
                rel="noreferrer"
                aria-label={`${global.businessName} on ${social.platform}`}
                onClick={() => track("cta_click", { cta: social.platform, destination: social.url })}
                className="grid h-10 w-10 place-items-center rounded-full border border-cream/15 text-cream/80 transition-all hover:-translate-y-0.5 hover:border-gold hover:text-gold"
              >
                <SocialIcon platform={social.platform} className="h-5 w-5" />
              </a>
            ))}
          </div>
          {global.socials[0] && (
            <a href={global.socials[0].url} target="_blank" rel="noreferrer" className="mt-4 inline-block text-sm font-semibold text-amber transition-colors hover:text-gold">
              {global.socials[0].label} →
            </a>
          )}
        </Reveal>

        {NAV.filter((i) => i.children).map((group, gi) => (
          <Reveal key={group.label} delay={0.08 * (gi + 1)}>
            <p className="font-groovy text-sm uppercase tracking-[0.2em] text-amber">
              {group.label}
            </p>
            <ul className="mt-3 space-y-2">
              {group.children!.map((c) => (
                <li key={c.to}>
                  {c.external ? (
                    <a
                      href={c.to}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-cream/75 transition-colors hover:text-gold"
                    >
                      {c.label}
                    </a>
                  ) : (
                    <Link
                      to={c.to}
                      className="text-sm text-cream/75 transition-colors hover:text-gold"
                    >
                      {c.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </Reveal>
        ))}

        <Reveal delay={0.24}>
          <p className="font-groovy text-sm uppercase tracking-[0.2em] text-amber">
            Visit
          </p>
          <p className="mt-3 text-sm text-cream/75">{global.address}</p>
          <p className="text-sm text-cream/75">{global.neighborhood}</p>
          <p className="mt-2 text-sm text-cream/75">{global.phone}</p>
          {global.email && <p className="mt-1 text-sm text-cream/75">{global.email}</p>}
        </Reveal>
      </div>

      <div className="relative border-t border-cream/10 py-5 text-center text-xs text-cream/50">
        © {new Date().getFullYear()} {global.businessName} {global.tagline} · Pittsburgh, PA
      </div>
    </footer>
  );
}
