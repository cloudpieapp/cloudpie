import { ReactNode, useEffect } from "react";
import { useLocation } from "react-router-dom";
import TopBar from "./TopBar";
import BottomNav from "./BottomNav";
import Footer from "./Footer";
import InlineAdRow from "./InlineAdRow";


interface AppLayoutProps {
  children: ReactNode;
  hideNav?: boolean;
  hideFooter?: boolean;
}

const NO_END_AD = [
  "/my-downloads", "/profile", "/signin", "/welcome", "/onboarding",
  "/faq", "/investors", "/ways-to-watch", "/corporate", "/legal-notices",
  "/help", "/jobs", "/terms", "/contact", "/only-on-bingbloom",
  "/redeem", "/privacy", "/speed-test", "/ad-choices", "/media",
  "/gift-cards", "/cookie-preferences", "/legal-guarantee", "/follow-us",
  "/install", "/search",
];

const AppLayout = ({ children, hideNav, hideFooter }: AppLayoutProps) => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname]);

  if (hideNav) return <>{children}</>;

  const showEndAd = !NO_END_AD.some((p) => pathname.startsWith(p));
  const FOOTER_ROUTES = ["/", "/home", "/settings"];
  const showFooter = !hideFooter && FOOTER_ROUTES.includes(pathname);

  const isAnime = pathname.startsWith("/anime");
  const isLiveTv = pathname.startsWith("/live-tv");

  return (
    <div className="min-h-screen bg-bingbloom-app">
      <TopBar />
      <div className="pt-12 md:pt-14" />
      <main className="pb-20 md:pb-0 max-w-[1600px] mx-auto">
        {children}
        {showEndAd && (
          <section aria-label="Advertisement" className="m-0 p-0 leading-none">
            <InlineAdRow count={4} />
          </section>
        )}
      </main>
      {showFooter && <Footer />}
      <BottomNav />
      {isAnime && (
        <ExternalSiteDialog
          storageKey="anime"
          title="Anime has moved to NowAnime"
          description="We launched a brand-new anime site — NowAnime. It has a bigger library, faster streams and subs/dubs. Continue there to keep watching."
          url="https://nowanime.lovable.app"
          ctaLabel="Go to NowAnime"
        />
      )}
      {isLiveTv && (
        <ExternalSiteDialog
          storageKey="live-tv"
          title="Live TV has moved to OpenCast TV"
          description="Our live channels now stream on OpenCast TV — more channels, better uptime. Continue there to watch live."
          url="https://opencasttv.lovable.app"
          ctaLabel="Go to OpenCast TV"
        />
      )}
    </div>
  );
};


export default AppLayout;
