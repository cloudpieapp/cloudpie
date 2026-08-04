import { useEffect, useState } from "react";
import { X, Clapperboard } from "lucide-react";
import { Link } from "react-router-dom";

const KEY = "bb:new-movies-banner:2026-08";

const NewMoviesBanner = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.localStorage.getItem(KEY)) return;
    setVisible(true);
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    window.localStorage.setItem(KEY, "1");
    setVisible(false);
  };

  return (
    <div className="mx-3 mt-3 rounded-xl border border-primary/25 bg-primary/10 px-3 py-2.5">
      <div className="flex items-start gap-2.5">
        <Clapperboard className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <p className="flex-1 text-sm leading-snug text-foreground">
          <span className="font-semibold">New movies have arrived! </span>
          <Link to="/movie/969681" className="underline underline-offset-2">
            Spider-Man: Brand New Day
          </Link>
          {" & "}
          <Link to="/movie/1368337" className="underline underline-offset-2">
            The Odyssey
          </Link>
          {" are now available to watch."}
        </p>
        <button
          onClick={dismiss}
          aria-label="Dismiss notification"
          className="rounded-full p-1 text-muted-foreground transition hover:bg-muted"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default NewMoviesBanner;