import BannerAd468 from "./BannerAd468";
type AdFormat = "banner-468x60" | "banner-728x90" | "banner-320x50" | "rect-160x300" | "sky-160x600";
interface AdBannerProps { format: AdFormat; className?: string; label?: boolean }
// All banner slots now use the single 468x60 ad code.
const AdBanner = ({ className = "", label = true }: AdBannerProps) => (
  <BannerAd468 className={`my-4 ${className}`} label={label} />
);
export default AdBanner;
