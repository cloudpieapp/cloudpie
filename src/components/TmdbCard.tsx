import { Link } from "react-router-dom";
import { Star, Play } from "lucide-react";
import { TmdbItem, img } from "@/lib/tmdb";

interface TmdbCardProps {
  item: TmdbItem;
  type?: "movie" | "tv";
  width?: number;
  fill?: boolean;
  rank?: number;
}

/** Editorial noir poster card used throughout full-width content rows. */
const TmdbCard = ({ item, type, width, fill, rank }: TmdbCardProps) => {
  const mediaType = type || item.media_type || (item.first_air_date ? "tv" : "movie");
  const to = `/${mediaType}/${item.id}`;
  const year = (item.release_date || item.first_air_date || "").slice(0, 4);
  const poster = img(item.poster_path, "w300") || "/placeholder.svg";

  const sizingClass = fill
    ? "w-full"
    : "w-[108px] sm:w-[132px] md:w-[168px] lg:w-[180px]";
  const inlineStyle = !fill && width ? { width, minWidth: width } : undefined;

  return (
    <Link
      to={to}
      className={`group flex-shrink-0 snap-start ${sizingClass}`}
      style={inlineStyle}
    >
      <div className="aspect-[2/3] rounded-sm overflow-hidden relative bg-surface-2 ring-1 ring-border/60 transition-all duration-300 group-hover:-translate-y-1 group-hover:ring-primary/60">
        <img
          src={poster}
          alt={item.title}
          loading="lazy"
          className="w-full h-full object-cover transition group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <span className="rounded-full bg-primary p-2.5 text-primary-foreground shadow-xl">
            <Play className="w-3.5 h-3.5 fill-current" />
          </span>
        </div>
        {item.vote_average > 0 && (
          <div className="absolute top-1.5 left-1.5 flex items-center gap-0.5 rounded-sm bg-background/80 px-1.5 py-0.5 text-[9px] font-medium text-primary backdrop-blur-sm">
            <Star className="w-2.5 h-2.5 fill-current" /> {item.vote_average.toFixed(1)}
          </div>
        )}
        <div className="absolute top-1.5 right-1.5 rounded-sm bg-background/80 px-1.5 py-0.5 text-[8px] font-medium uppercase tracking-wider text-foreground backdrop-blur-sm">
          {mediaType === "tv" ? "TV" : "Movie"}
        </div>
        {rank !== undefined && (
          <div className="absolute bottom-0 left-0 flex h-full w-7 flex-col items-center justify-end bg-gradient-to-t from-black/90 to-transparent">
            <span className="mb-1 font-display text-2xl text-primary">{String(rank).padStart(2, "0")}</span>
          </div>
        )}
      </div>
      <div className="mt-2 px-0.5">
        <p className="font-display text-[15px] md:text-[17px] leading-tight text-foreground line-clamp-1 group-hover:text-primary">{item.title}</p>
        {year && <p className="mt-0.5 text-[9px] md:text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{year}</p>}
      </div>
    </Link>
  );
};

export default TmdbCard;
