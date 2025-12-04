import { useEffect } from 'react';
export var SEOHead = function (_a) {
    var _b = _a.title, title = _b === void 0 ? 'The New Fuse - AI Collaboration Platform' : _b, _c = _a.description, description = _c === void 0 ? 'Orchestrate intelligent workflows, enable seamless agent communication, and unlock the full potential of AI automation with The New Fuse.' : _c, _d = _a.keywords, keywords = _d === void 0 ? ['AI', 'automation', 'workflow', 'agent communication', 'MCP', 'A2A protocol', 'AI orchestration'] : _d, _e = _a.image, image = _e === void 0 ? '/og-image.png' : _e, _f = _a.url, url = _f === void 0 ? typeof window !== 'undefined' ? window.location.href : '' : _f, _g = _a.type, type = _g === void 0 ? 'website' : _g, _h = _a.author, author = _h === void 0 ? 'The New Fuse Team' : _h, publishedTime = _a.publishedTime, modifiedTime = _a.modifiedTime, section = _a.section, _j = _a.tags, tags = _j === void 0 ? [] : _j, _k = _a.noIndex, noIndex = _k === void 0 ? false : _k, canonical = _a.canonical, structuredData = _a.structuredData;
    var siteName = 'The New Fuse';
    var twitterHandle = '@thenewfuse';
    // Generate default structured data if not provided
    var defaultStructuredData = {
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
    var finalStructuredData = structuredData || defaultStructuredData;
    useEffect(function () {
        // Update document title
        document.title = title;
        // Helper function to set or update meta tags
        var setMetaTag = function (name, content, property) {
            var attribute = property ? 'property' : 'name';
            var element = document.querySelector("meta[".concat(attribute, "=\"").concat(name, "\"]"));
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
        if (keywords.length > 0)
            setMetaTag('keywords', keywords.join(', '));
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
            if (publishedTime)
                setMetaTag('article:published_time', publishedTime, true);
            if (modifiedTime)
                setMetaTag('article:modified_time', modifiedTime, true);
            if (section)
                setMetaTag('article:section', section, true);
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
            var linkElement = document.querySelector('link[rel="canonical"]');
            if (!linkElement) {
                linkElement = document.createElement('link');
                linkElement.setAttribute('rel', 'canonical');
                document.head.appendChild(linkElement);
            }
            linkElement.setAttribute('href', canonical);
        }
        // Add structured data
        var scriptElement = document.querySelector('script[type="application/ld+json"]');
        if (!scriptElement) {
            scriptElement = document.createElement('script');
            scriptElement.setAttribute('type', 'application/ld+json');
            document.head.appendChild(scriptElement);
        }
        scriptElement.textContent = JSON.stringify(finalStructuredData);
        // Cleanup function
        return function () {
            // Reset title to default
            document.title = 'The New Fuse - AI Collaboration Platform';
        };
    }, [title, description, keywords, image, url, type, author, publishedTime, modifiedTime, section, tags, noIndex, canonical, finalStructuredData, siteName, twitterHandle]);
    return null; // This component doesn't render anything
};
