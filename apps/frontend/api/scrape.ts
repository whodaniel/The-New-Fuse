/**
 * Vercel Serverless Function: Web Scraping
 * 
 * Provides web scraping capabilities for AI agents
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { WebScrapingService } from '../../../packages/web-scraping/src/core/WebScrapingService';

// Initialize scraping service with serverless-optimized config
const scrapingService = new WebScrapingService(
  {
    maxFileSize: 5 * 1024 * 1024, // 5MB limit
    rateLimit: {
      requests: 20,
      windowMs: 60000 // 1 minute
    },
    contentFiltering: true
  },
  {
    timeout: 15000, // 15 second timeout
    userAgent: 'Mozilla/5.0 (compatible; TheNewFuse-Scraper/1.0)',
    viewport: { width: 1280, height: 720 } // Smaller viewport for serverless
  }
);

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow GET and POST
  if (!['GET', 'POST'].includes(req.method || '')) {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    // Extract parameters
    const params = req.method === 'GET' 
      ? {
          url: req.query.url as string,
          method: (req.query.method as string) || 'simple',
          config: req.query.config ? JSON.parse(req.query.config as string) : {},
          extraction: req.query.extraction ? JSON.parse(req.query.extraction as string) : {}
        }
      : req.body;

    const { url, method = 'simple', config = {}, extraction = {} } = params;

    // Validate required parameters
    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL parameter is required'
      });
    }

    // Validate method
    if (!['simple', 'full', 'auto'].includes(method)) {
      return res.status(400).json({
        success: false,
        error: 'Method must be one of: simple, full, auto'
      });
    }

    let result;

    // Execute scraping based on method
    switch (method) {
      case 'simple':
        result = await scrapingService.scrapeSimple(url, config, extraction);
        break;
      case 'full':
        result = await scrapingService.scrapeFull(url, config, extraction);
        break;
      case 'auto':
        result = await scrapingService.scrapeAuto(url, config, extraction);
        break;
      default:
        throw new Error(`Unknown scraping method: ${method}`);
    }

    // Return result
    res.status(200).json({
      success: result.success,
      data: {
        url: result.url,
        title: result.title,
        description: result.description,
        text: result.text,
        links: result.links?.slice(0, 20), // Limit for serverless response size
        images: result.images?.slice(0, 10),
        statusCode: result.statusCode,
        metadata: {
          executionTime: result.metadata?.executionTime,
          method: result.metadata?.method,
          timestamp: result.metadata?.timestamp
        }
      },
      error: result.error
    });

  } catch (error) {
    console.error('Scraping error:', error);
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      metadata: {
        timestamp: new Date().toISOString(),
        function: 'scrape'
      }
    });
  } finally {
    // Cleanup resources
    await scrapingService.cleanup();
  }
}