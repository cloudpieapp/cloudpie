import { MessageCircle, Send } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

export const WHATSAPP_CHANNEL = "https://whatsapp.com/channel/0029VbD2CdHEwEjtJ5Utbo2n";
export const TELEGRAM_CHANNEL = "https://t.me/bingbloom";

/**
 * Join-our-community row: WhatsApp channel + Telegram group.
 * Replaces the old auto-opening WhatsApp popup.
 */
const CommunityLinks = ({ className = "" }: { className?: string }) => (
  <section className={`rounded-2xl border border-border/60 bg-card p-3 ${className}`}>
    <p className="text-[12.5px] font-bold text-foreground">Join the BingBloom community</p>
    <p className="mt-0.5 text-[11px] text-muted-foreground">
      Get new release alerts, app updates and support.
    </p>
    <div className="mt-2.5 flex flex-wrap gap-2">
      <a
        href={WHATSAPP_CHANNEL}
        target="_blank"
        rel="noreferrer"
        onClick={() => trackEvent("community_click", { channel: "whatsapp" })}
        className="flex min-h-[44px] flex-1 min-w-[140px] items-center justify-center gap-2 rounded-xl bg-[#25D366] px-3 text-[12px] font-bold text-black"
      >
        <MessageCircle className="h-4 w-4" /> WhatsApp channel
      </a>
      <a
        href={TELEGRAM_CHANNEL}
        target="_blank"
        rel="noreferrer"
        onClick={() => trackEvent("community_click", { channel: "telegram" })}
        className="flex min-h-[44px] flex-1 min-w-[140px] items-center justify-center gap-2 rounded-xl bg-[#229ED9] px-3 text-[12px] font-bold text-white"
      >
        <Send className="h-4 w-4" /> Telegram
      </a>
    </div>
  </section>
);

export default CommunityLinks;
