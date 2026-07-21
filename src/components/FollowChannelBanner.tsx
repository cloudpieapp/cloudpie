import { useState, useEffect } from "react";
import { X, Users } from "lucide-react";

const KEY = "bb:follow-cta:dismissed-at";
const HIDE_MS = 7 * 24 * 60 * 60 * 1000;
const WHATSAPP_URL = "https://whatsapp.com/channel/0029VbA3XSg2phHKzGkOtu46";

/**
 * Slim CTA replacing the previous "app has ads" notice. Asks viewers to help
 * grow the WhatsApp channel now that it hit 100 followers.
 */
const FollowChannelBanner = () => {
  const [show, setShow] = useState(false);
  useEffect(() => {
    try {
      const at = Number(localStorage.getItem(KEY) || 0);
      if (!at || Date.now() - at > HIDE_MS) setShow(true);
    } catch { setShow(true); }
  }, []);

  if (!show) return null;

  const dismiss = () => {
    try { localStorage.setItem(KEY, String(Date.now())); } catch { /* ignore */ }
    setShow(false);
  };

  const follow = () => {
    window.open(WHATSAPP_URL, "_blank", "noopener,noreferrer");
    dismiss();
  };

  return (
    <div
      className="flex items-center gap-2 px-3 py-2 text-[11px] text-white"
      style={{ background: "linear-gradient(90deg,#0b0b0b,#1c0507)", borderBottom: "1px solid rgba(229,9,20,0.3)" }}
    >
      <span className="grid place-items-center h-6 w-6 rounded-full bg-[#E50914]/20 text-[#E50914]">
        <Users className="w-3 h-3" />
      </span>
      <p className="flex-1 min-w-0 truncate">
        We just hit <strong>100 followers</strong> — help us grow!
      </p>
      <button
        onClick={follow}
        className="px-2.5 py-1 rounded-md text-[10.5px] font-bold bg-[#E50914] text-white hover:opacity-90"
      >
        Follow channel
      </button>
      <button onClick={dismiss} aria-label="Dismiss" className="p-1 text-white/50 hover:text-white">
        <X className="w-3 h-3" />
      </button>
    </div>
  );
};

export default FollowChannelBanner;