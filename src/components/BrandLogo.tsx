interface Props {
  size?: number;
  withWordmark?: boolean;
  wordmarkSize?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const BrandLogo = ({ size = 56, withWordmark = true, wordmarkSize = "md", className = "" }: Props) => {
  const wm = {
    sm: "text-base",
    md: "text-xl",
    lg: "text-3xl",
    xl: "text-4xl",
  }[wordmarkSize];
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <img
        src="/logo-compact.png"
        alt="CloudPie"
        style={{ width: size, height: size, objectFit: "contain" }}
      />
      {withWordmark && (
        <p className={`${wm} font-extrabold tracking-tight mt-1.5 leading-none text-foreground`}>
          CloudPie
        </p>
      )}
    </div>
  );
};

export default BrandLogo;
