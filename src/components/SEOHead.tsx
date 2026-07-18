import { useEffect } from "react";
import { useLocation } from "react-router-dom";

interface SEOHeadProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: string;
  noIndex?: boolean;
}

const SITE_URL = "https://www.kinderstars.co.uk";
const DEFAULT_TITLE = "KinderStars – Find Trusted Childminders Across the UK";
const DEFAULT_DESC = "KinderStars is a nationwide Childminder Agency helping UK parents find DBS-checked, quality-assured childminders.";
const DEFAULT_IMAGE = `${SITE_URL}/favicon.png`;

const SEOHead = ({
  title,
  description,
  canonical,
  ogImage,
  ogType = "website",
  noIndex = false,
}: SEOHeadProps) => {
  const location = useLocation();
  const pageTitle = title ? `${title} | KinderStars` : DEFAULT_TITLE;
  const pageDesc = description || DEFAULT_DESC;
  const pageUrl = canonical || `${SITE_URL}${location.pathname}`;
  const pageImage = ogImage || DEFAULT_IMAGE;

  useEffect(() => {
    document.title = pageTitle;

    const setMeta = (attr: string, key: string, content: string) => {
      let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    setMeta("name", "description", pageDesc);
    setMeta("name", "robots", noIndex ? "noindex, nofollow" : "index, follow");
    setMeta("property", "og:title", pageTitle);
    setMeta("property", "og:description", pageDesc);
    setMeta("property", "og:url", pageUrl);
    setMeta("property", "og:image", pageImage);
    setMeta("property", "og:type", ogType);
    setMeta("property", "og:site_name", "KinderStars");
    setMeta("name", "twitter:card", "summary_large_image");
    setMeta("name", "twitter:title", pageTitle);
    setMeta("name", "twitter:description", pageDesc);
    setMeta("name", "twitter:image", pageImage);

    // Update canonical
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!link) {
      link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      document.head.appendChild(link);
    }
    link.setAttribute("href", pageUrl);

    return () => {
      document.title = DEFAULT_TITLE;
    };
  }, [pageTitle, pageDesc, pageUrl, pageImage, ogType, noIndex]);

  return null;
};

export default SEOHead;
