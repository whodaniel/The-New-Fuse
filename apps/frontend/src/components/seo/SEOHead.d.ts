import React from 'react';
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
export declare const SEOHead: React.FC<SEOProps>;
