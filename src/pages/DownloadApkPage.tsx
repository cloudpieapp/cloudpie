import { ArrowLeft, Download, MessageCircle, Send, Smartphone } from "lucide-react";
import { Link } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import BrandLogo from "@/components/BrandLogo";
import SEO from "@/components/SEO";

const options = [
  {
    label: "Get APK on WhatsApp",
    href: "https://whatsapp.com/channel/0029VbD2CdHEwEjtJ5Utbo2n",
    icon: MessageCircle,
    external: true,
  },
  {
    label: "Get APK on Telegram",
    href: "https://t.me/bingbloom",
    icon: Send,
    external: true,
  },
  {
    label: "Text Us for the APK",
    href: "https://wa.me/254733541119?text=Hi%2C%20I%20would%20like%20to%20get%20the%20BingBloom%20APK",
    icon: Download,
    external: true,
  },
];

const DownloadApkPage = () => (
  <AppLayout>
    <SEO title="Get the BingBloom App" description="Join our community to get the latest APK, installation instructions, and app updates. Choose your preferred option below." />

    <div className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-4 py-10 sm:px-6">
      <div className="rounded-[28px] border border-border/60 bg-card/90 p-5 shadow-2xl shadow-black/30 backdrop-blur-sm sm:p-8">
        <div className="mb-6 flex justify-center">
          <BrandLogo size={68} withWordmark={false} className="rounded-2xl bg-primary/10 p-3" />
        </div>

        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Get the BingBloom App</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
            Join our community to get the latest APK, installation instructions, and app updates. Choose your preferred option below.
          </p>
        </div>

        <div className="mt-6 space-y-3">
          {options.map(({ label, href, icon: Icon, external }) => (
            <a
              key={label}
              href={href}
              target={external ? "_blank" : undefined}
              rel={external ? "noopener noreferrer" : undefined}
              className="flex w-full items-center justify-between gap-3 rounded-2xl border border-border/60 bg-background/80 px-4 py-3.5 text-left text-foreground transition hover:border-primary/50 hover:bg-primary/5"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="text-sm font-medium sm:text-base">{label}</span>
              </div>
              <span className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Open</span>
            </a>
          ))}
        </div>

        <div className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-600">
          <p className="leading-6">Having trouble installing the app? Contact our support team and we’ll help you.</p>
        </div>

        <div className="mt-6 flex items-center justify-center">
          <Link to="/home" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
            <ArrowLeft className="h-4 w-4" />
            Back to BingBloom
          </Link>
        </div>
      </div>
    </div>
  </AppLayout>
);

export default DownloadApkPage;
