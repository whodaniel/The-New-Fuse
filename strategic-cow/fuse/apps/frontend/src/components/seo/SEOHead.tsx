import React, { useEffect } from 'react';

export interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  section?: string;
  tags?: string[];
  noIndex?: boolean;
  canonical?: string;
  structuredData?: object;
}

export const SEOHead: React.FC<SEOProps> = ({
  title = 'The New Fuse - AI Collaboration Platform',
  description = 'Orchestrate intelligent workflows, enable seamless agent communication, and unlock the full potential of AI automation with The New Fuse.',
  keywords = ['AI', 'automation', 'workflow', 'agent communication', 'MCP', 'A2A protocol', 'AI orchestration'],
  image = '/og-image.png',
  url = typeof window !== 'undefined' ? window.location.href : '',
  type = 'website',
  author = 'The New Fuse Team',
  publishedTime,
  modifiedTime,
  section,
  tags = [],
  noIndex = false,
  canonical,
  structuredData,
}) => {
  const siteName = 'The New Fuse';
  const twitterHandle = '@thenewfuse';

  // Generate default structured data if not provided
  const defaultStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: siteName,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    description: description,
    image: image,
    url: url,
    author: {
      '@type': 'Organization',
      name: siteName,
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '250',
    },
    featureList: [
      'AI Agent Management',
      'Workflow Automation',
      'Agent Communication (MCP & A2A)',
      'Enterprise Security',
      'Advanced Analytics',
      'Developer Tools',
    ],
  };

  const finalStructuredData = structuredData || defaultStructuredData;

  useEffect(() => {
    // Update document title
    document.title = title;

    // Helper function to set or update meta tags
    const setMetaTag = (name: string, content: string, property?: boolean) => {
      const attribute = property ? 'property' : 'name';
      let element = document.querySelector(`meta[${attribute}="${name}"]`);

      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, name);
        document.head.appendChild(element);
      }

      element.setAttribute('content', content);
    };

    // Set primary meta tags
    setMetaTag('title', title);
    setMetaTag('description', description);
    if (keywords.length > 0) setMetaTag('keywords', keywords.join(', '));
    setMetaTag('author', author);

    // Set Open Graph tags
    setMetaTag('og:type', type, true);
    setMetaTag('og:url', url, true);
    setMetaTag('og:title', title, true);
    setMetaTag('og:description', description, true);
    setMetaTag('og:image', image, true);
    setMetaTag('og:site_name', siteName, true);
    setMetaTag('og:locale', 'en_US', true);

    // Set article-specific tags
    if (type === 'article') {
      if (publishedTime) setMetaTag('article:published_time', publishedTime, true);
      if (modifiedTime) setMetaTag('article:modified_time', modifiedTime, true);
      if (section) setMetaTag('article:section', section, true);
    }

    // Set Twitter tags
    setMetaTag('twitter:card', 'summary_large_image');
    setMetaTag('twitter:url', url);
    setMetaTag('twitter:title', title);
    setMetaTag('twitter:description', description);
    setMetaTag('twitter:image', image);
    setMetaTag('twitter:site', twitterHandle);
    setMetaTag('twitter:creator', twitterHandle);

    // Set robots meta tag
    if (noIndex) {
      setMetaTag('robots', 'noindex, nofollow');
    }

    // Set canonical link
    if (canonical) {
      let linkElement = document.querySelector('link[rel="canonical"]');
      if (!linkElement) {
        linkElement = document.createElement('link');
        linkElement.setAttribute('rel', 'canonical');
        document.head.appendChild(linkElement);
      }
      linkElement.setAttribute('href', canonical);
    }

    // Add structured data
    let scriptElement = document.querySelector('script[type="application/ld+json"]');
    if (!scriptElement) {
      scriptElement = document.createElement('script');
      scriptElement.setAttribute('type', 'application/ld+json');
      document.head.appendChild(scriptElement);
    }
    scriptElement.textContent = JSON.stringify(finalStructuredData);

    // Cleanup function
    return () => {
      // Reset title to default
      document.title = 'The New Fuse - AI Collaboration Platform';
    };
  }, [title, description, keywords, image, url, type, author, publishedTime, modifiedTime, section, tags, noIndex, canonical, finalStructuredData, siteName, twitterHandle]);

  return null; // This component doesn't render anything
};
