import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ExternalLink, Sparkles } from "lucide-react";
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

interface Props {
  storageKey: string;
  title: string;
  description: string;
  url: string;
}

const DedicatedAppDialog = ({ storageKey, title, description, url }: Props) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (sessionStorage.getItem(storageKey)) return;
    setOpen(true);
  }, [storageKey]);

  const close = () => {
    sessionStorage.setItem(storageKey, "1");
    setOpen(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={(v) => { if (!v) close(); }}>
      <AlertDialogContent className="max-w-sm">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-primary" /> {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm">{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => { close(); navigate(-1); }}>Not now</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              close();
              window.open(url, "_blank", "noopener,noreferrer");
            }}
          >
            Proceed <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DedicatedAppDialog;