import { useState } from "react";
import { ArrowUpRight, X } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

interface ExternalSiteNoticeProps {
  title: string;
  description: string;
  url: string;
  ctaLabel?: string;
  /** Used for analytics + remembering dismissal for this session. */
  storageKey: string;
}

/**
 * Non-blocking banner shown at the top of a section (Anime, Live TV) pointing
 * users to one of our other apps. Unlike a dialog it never interrupts
 * navigation — the section stays fully usable.
 */
const ExternalSiteNotice = ({
  title,
  description,
  url,
  ctaLabel = "Open",
  storageKey,
}: ExternalSiteNoticeProps) => {
  const dismissKey = `bb-notice-dismissed-${storageKey}`;
  const [hidden, setHidden] = useState(() => {
    try {
      return sessionStorage.getItem(dismissKey) === "1";
    } catch {
      return false;
    }
  });

  if (hidden) return null;

  const dismiss = () => {
    try {
      sessionStorage.setItem(dismissKey, "1");
    } catch {
      /* ignore */
    }
    setHidden(true);
  };

  return (
    <div className="px-3 pt-3">
      <div className="flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/10 px-3 py-2.5">
        <div className="min-w-0 flex-1">
          <p className="text-[12.5px] font-bold text-foreground">{title}</p>
          <p className="mt-0.5 text-[11.5px] leading-snug text-muted-foreground">{description}</p>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackEvent("external_app_notice_click", { destination: url, source: storageKey })}
            className="mt-2 inline-flex min-h-[36px] items-center gap-1.5 rounded-full bg-primary px-3.5 text-[11.5px] font-bold text-primary-foreground"
          >
            {ctaLabel} <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        </div>
        <button
          type="button"
          aria-label="Dismiss"
          onClick={dismiss}
          className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-foreground/10"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};

export default ExternalSiteNotice;
