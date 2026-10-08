export type videoComponentType = {
  src?: string;
  label?: string;
  title?: string;
  ctaText?: string;
  ctaHref?: string;
  style?: React.CSSProperties;
};

export type AdvertisementFooterProps = {
  label?: string;
  heading: string;
  ctaText?: string;
  ctaHref?: string;
};

export type ShowCaseWindow = {
  image?: string;
  productPrice?: string;
  href?: string;
  price?: number;
  label?: string;
};

export type DynamicWindowProductShowCaseSectionProps = {
  heading: string;
  windows: ShowCaseWindow[];
  showButton?: boolean;
  buttonText?: string;
  buttonHref?: string;
};

export type DynamicWindowShowCaseSectionProps = {
  heading: string;
  windows: ShowCaseWindow[];
};

export type ServiceWindow = {
  videoSrc: string;
  label: string;
  ctaText: string;
  ctaHref: string;
};

export type GajrajServiceShowCaseSectionProps = {
  heading: string;
  services: ServiceWindow[];
};

export type ImageComponentProps = {
  src?: string;
  label?: string;
  title?: string;
  ctaText?: string;
  ctaHref?: string;
};
