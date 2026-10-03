import BannerAd468 from "./BannerAd468";
const AdsterraIframeAd = ({ className = "", desktopOnly = false }: { className?: string; desktopOnly?: boolean }) => (
  <BannerAd468 className={`${desktopOnly ? "hidden md:block" : ""} ${className}`} />
);
export default AdsterraIframeAd;
