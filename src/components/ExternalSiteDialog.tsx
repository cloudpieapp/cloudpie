import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ExternalSiteDialogProps {
  title: string;
  description: string;
  url: string;
  ctaLabel?: string;
  /** Unique key so we can decide when to re-show the notice */
  storageKey: string;
  /** Where to send the user if they decline (must stay inside the app). */
  fallbackRoute?: string;
}

/**
 * Confirmation dialog shown before sending the user to one of our other apps.
 * Confirming opens the destination in a new tab so BingBloom stays alive in the
 * original tab; declining always lands the user on a real in-app route so
 * navigation keeps working.
 */
const ExternalSiteDialog = ({
  title,
  description,
  url,
  ctaLabel = "Continue",
  storageKey,
  fallbackRoute = "/home",
}: ExternalSiteDialogProps) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setOpen(true);
  }, [storageKey]);

  const go = () => {
    trackEvent("external_app_redirect", { destination: url, source: storageKey });
    setOpen(false);
    // Open our other app in a new tab/window, then keep this tab on a working
    // in-app route. Falls back to a same-tab navigation if popups are blocked
    // (installed PWAs / in-app webviews).
    let win: Window | null = null;
    try {
      win = window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      win = null;
    }
    if (!win) {
      window.location.href = url;
      return;
    }
    navigate(fallbackRoute, { replace: true });
  };

  const dismiss = () => {
    trackEvent("external_app_declined", { destination: url, source: storageKey });
    setOpen(false);
    // Never call navigate(-1): on a fresh entry there is no in-app history and
    // the user would be pushed out of the app. Always land on a valid route.
    navigate(fallbackRoute, { replace: true });
  };

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) dismiss();
      }}
    >
      <AlertDialogContent className="max-w-sm rounded-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-base">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-sm leading-relaxed">{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-row gap-2 sm:justify-end">
          <AlertDialogCancel onClick={dismiss} className="mt-0 min-h-[44px] flex-1 text-sm">
            Not now
          </AlertDialogCancel>
          <AlertDialogAction onClick={go} className="min-h-[44px] flex-1 gap-1.5 text-sm">
            {ctaLabel} <ExternalLink className="h-3.5 w-3.5" />
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ExternalSiteDialog;
