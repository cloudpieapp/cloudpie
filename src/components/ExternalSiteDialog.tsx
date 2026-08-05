import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ExternalLink } from "lucide-react";
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
}

const ExternalSiteDialog = ({ title, description, url, ctaLabel = "Continue", storageKey }: ExternalSiteDialogProps) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setOpen(true);
  }, [storageKey]);

  const go = () => {
    window.location.href = url;
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent className="max-w-sm rounded-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-base">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-sm leading-relaxed">{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-row gap-2 sm:justify-end">
          <AlertDialogCancel
            onClick={() => navigate(-1)}
            className="mt-0 min-h-[44px] flex-1 text-sm"
          >
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
