import { Link } from "react-router-dom";
import netflix from "@/assets/brands/netflix.png.asset.json";
import prime from "@/assets/brands/prime.png.asset.json";
import tubi from "@/assets/brands/tubi.png.asset.json";
import disney from "@/assets/brands/disney.png.asset.json";
import dreamworks from "@/assets/brands/dreamworks.png.asset.json";
import imax from "@/assets/brands/imax.png.asset.json";

// TMDB watch-provider IDs used for the /search?provider= filter (Task 10).
const BRANDS = [
  { slug: "netflix",    label: "Netflix",     img: netflix.url,    bg: "#0b0b0b", providerId: 8 },
  { slug: "prime",      label: "Prime Video", img: prime.url,      bg: "#000814", providerId: 9 },
  { slug: "tubi",       label: "Tubi",        img: tubi.url,       bg: "#5b21b6", providerId: 73 },
  { slug: "disney",     label: "Disney+",     img: disney.url,     bg: "#02264a", providerId: 337 },
  { slug: "dreamworks", label: "DreamWorks",  img: dreamworks.url, bg: "#0b1e3b", providerId: 521 },
  { slug: "imax",       label: "IMAX",        img: imax.url,       bg: "#000000", providerId: 0 },
];

/**
 * Streaming Universe rail — quick-access cards on the home page. Tapping a
 * card routes to search filtered by that streaming provider.
 */
const StreamingBrandsRow = () => (
  <section className="px-4 md:px-6 py-4">
    <div className="flex items-baseline justify-between mb-2">
      <h2 className="text-white text-sm font-bold tracking-tight">Streaming Universe</h2>
      <span className="text-[10px] text-white/45">Browse by service</span>
    </div>
    <div className="flex gap-2.5 overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
      {BRANDS.map((b) => (
        <Link
          key={b.slug}
          to={`/search?provider=${b.slug}`}
          className="group flex-shrink-0 w-[128px] h-[72px] rounded-xl overflow-hidden border border-white/10 grid place-items-center transition-transform hover:scale-[1.04]"
          style={{ background: b.bg }}
          aria-label={b.label}
        >
          <img
            src={b.img}
            alt={b.label}
            loading="lazy"
            className="max-w-[86%] max-h-[70%] object-contain drop-shadow-md"
          />
        </Link>
      ))}
    </div>
  </section>
);

export default StreamingBrandsRow;

// Exposed for other pages (search, etc.) that need to translate a slug into a
// TMDB watch-provider id.
export const BRAND_PROVIDER_MAP: Record<string, { label: string; providerId: number }> = Object.fromEntries(
  BRANDS.map((b) => [b.slug, { label: b.label, providerId: b.providerId }]),
);