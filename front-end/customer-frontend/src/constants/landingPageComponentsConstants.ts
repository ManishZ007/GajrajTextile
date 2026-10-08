import {
  AdvertisementFooterProps,
  DynamicWindowProductShowCaseSectionProps,
  DynamicWindowShowCaseSectionProps,
  GajrajServiceShowCaseSectionProps,
  ImageComponentProps,
  videoComponentType,
} from '@/types/landingPageType';

export const videoComponentConstants: videoComponentType = {
  label: 'Handcrafted Silk',
  title: 'Through Generations',
  ctaText: 'Explore Collection',
  ctaHref: '/collections',
};

export const heroImageConstants: ImageComponentProps = {
  src: '/images/silk1.png',
  label: 'Women',
  title: 'Handwoven Paithani',
  ctaText: 'Explore',
  ctaHref: '/collections/paithani',
};

export const productShowcaseConstants: DynamicWindowProductShowCaseSectionProps =
  {
    heading: 'Explore Our Collections',
    windows: [
      {
        image: '/images/silk1.png',
        productPrice: 'Paithani Sarees',
        price: 30000,
        href: '/products?category=paithani',
      },
      {
        image: '/images/silk1.png',
        productPrice: 'Silk Collection',
        price: 30000,
        href: '/products?category=silk',
      },
      {
        image: '/images/silk1.png',
        productPrice: 'Bridal Wear',
        price: 30000,
        href: '/products?category=bridal',
      },
      {
        image: '/images/silk1.png',
        productPrice: 'Custom Orders',
        price: 30000,
        href: '/customize',
      },
    ],
    showButton: true,
    buttonText: 'View All Products',
    buttonHref: '/products',
  };

export const categoryShowcaseConstants: DynamicWindowShowCaseSectionProps = {
  heading: 'Explore Our Collections',
  windows: [
    {
      image: '/images/silk1.png',
      label: 'Paithani Sarees',
      href: '/products?category=paithani',
    },
    {
      image: '/images/silk1.png',
      label: 'Silk Collection',
      href: '/products?category=silk',
    },
    {
      image: '/images/silk1.png',
      label: 'Bridal Wear',
      href: '/products?category=bridal',
    },
    { image: '/images/silk1.png', label: 'Custom Orders', href: '/customize' },
  ],
};

export const serviceShowcaseConstants: GajrajServiceShowCaseSectionProps = {
  heading: 'Gajraj Services',
  services: [
    {
      videoSrc: '/videos/weaving.mp4',
      label: 'Custom Paithani',
      ctaText: 'Start Customising',
      ctaHref: '/customize',
    },
    {
      videoSrc: '/videos/collection.mp4',
      label: 'New Collection',
      ctaText: 'Explore Now',
      ctaHref: '/products',
    },
    {
      videoSrc: '/videos/care.mp4',
      label: 'Saree Care Guide',
      ctaText: 'Learn More',
      ctaHref: '/care',
    },
  ],
};

export const advertisementFooterConstants: AdvertisementFooterProps = {
  label: 'Discover What’s New',
  heading:
    'Explore new Paithani collections, exclusive designs and stories from our weavers.',
};

// i have made one folder that show single page that tells bout my product and respective service that folder name is (singlePagePresentation) that contain all the single page so now i want to build one page for FAQ when i click on FAQ in footer that will redirect to the this page so  what are the things i need to add in FAQ  page
