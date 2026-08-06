import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { screenNameFor, trackPageView, trackEvent } from "@/lib/analytics";

/**
 * Mounted once inside the router. Records exactly one page view per route
 * change (including back/forward navigation, which React Router surfaces as a
 * location change) and keeps the document title in sync so provider dashboards
 * show readable screen names.
 */
const RouteAnalytics = () => {
  const location = useLocation();

  useEffect(() => {
    const path = `${location.pathname}${location.search}`;
    // SEO components may set a richer title slightly after mount; prefer it.
    const raf = window.requestAnimationFrame(() => {
      const name = screenNameFor(location.pathname);
      trackPageView({
        path,
        title: document.title || name,
        extra: {
          screen_name: name,
          route: location.pathname,
          query: location.search ? location.search.replace(/^\?/, "") : undefined,
        },
      });
    });
    return () => window.cancelAnimationFrame(raf);
  }, [location.pathname, location.search]);

  // App lifecycle: foreground/background is useful for PWA session accuracy.
  useEffect(() => {
    const onVis = () => {
      trackEvent(document.visibilityState === "visible" ? "app_foreground" : "app_background");
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  return null;
};

export default RouteAnalytics;
