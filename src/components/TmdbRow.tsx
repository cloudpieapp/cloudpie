import { ChevronRight, RotateCw } from "lucide-react";
import { Link } from "react-router-dom";
import { TmdbItem } from "@/lib/tmdb";
import TmdbCard from "./TmdbCard";

interface TmdbRowProps {
  title: string;
  items?: TmdbItem[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  type?: "movie" | "tv";
  viewAll?: string;
  ranked?: boolean;
}

const TmdbRow = ({ title, items, isLoading, isError, onRetry, type, viewAll, ranked }: TmdbRowProps) => {
  const showEmpty = !isLoading && !isError && (!items || items.length === 0);

  return (
    <section className="mb-5 md:mb-7">
      <div className="flex items-center justify-between px-[4%] mb-2 md:mb-3">
        <h2 className="text-sm md:text-lg font-bold text-foreground">{title}</h2>
        {viewAll && !isError && (
          <Link to={viewAll} className="flex items-center gap-0.5 text-[10px] md:text-xs text-primary font-semibold hover:underline">
            All <ChevronRight className="w-3 h-3" />
          </Link>
        )}
      </div>

      {isError ? (
        <div className="mx-[4%] flex items-center justify-between gap-3 rounded-lg border border-border bg-card/60 px-3 py-3">
          <p className="text-xs md:text-sm text-muted-foreground">Unable to load this section.</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-[11px] md:text-xs font-semibold text-primary-foreground"
            >
              <RotateCw className="w-3.5 h-3.5" /> Retry
            </button>
          )}
        </div>
      ) : showEmpty ? (
        <p className="mx-[4%] rounded-lg border border-border bg-card/60 px-3 py-3 text-xs md:text-sm text-muted-foreground">
          No {type === "tv" ? "shows" : "movies"} found.
        </p>
      ) : (
        <div className="flex gap-2 md:gap-2.5 px-[4%] overflow-x-auto scrollbar-hide pb-2 snap-x snap-mandatory">
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex-shrink-0 w-[96px] sm:w-[120px] md:w-[140px] aspect-[2/3] rounded-md bg-card animate-pulse" />
              ))
            : items!.slice(0, 20).map((item, idx) => (
                <TmdbCard
                  key={`${item.id}-${item.media_type ?? type}`}
                  item={item}
                  type={type}
                  rank={ranked ? idx + 1 : undefined}
                />
              ))}
        </div>
      )}
    </section>
  );
};

export default TmdbRow;
