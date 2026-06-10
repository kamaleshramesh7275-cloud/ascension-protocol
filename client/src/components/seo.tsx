import { useEffect } from "react";

interface SeoProps {
  title: string;
  description?: string;
  url?: string;
}

export function Seo({ 
  title, 
  description = "Gamify your goals. Complete quests. Ascend to greatness. Track your real-life stats and climb the ranks from D to S tier.", 
  url 
}: SeoProps) {
  useEffect(() => {
    // Update title
    const fullTitle = `${title} | Ascensions Protocol`;
    document.title = fullTitle;
    document.querySelector('meta[property="og:title"]')?.setAttribute("content", fullTitle);
    document.querySelector('meta[property="twitter:title"]')?.setAttribute("content", fullTitle);

    // Update description
    document.querySelector('meta[name="description"]')?.setAttribute("content", description);
    document.querySelector('meta[property="og:description"]')?.setAttribute("content", description);
    document.querySelector('meta[property="twitter:description"]')?.setAttribute("content", description);

    // Update URL if provided
    if (url) {
      const fullUrl = `https://ascensions.in${url}`;
      document.querySelector('link[rel="canonical"]')?.setAttribute("href", fullUrl);
      document.querySelector('meta[property="og:url"]')?.setAttribute("content", fullUrl);
      document.querySelector('meta[property="twitter:url"]')?.setAttribute("content", fullUrl);
    }
  }, [title, description, url]);

  return null; // This component doesn't render anything
}
