/**
 * Vercel Serverless Function: Web Proxy
 * 
 * Provides CORS-free web access for AI agents
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ProxyService } from '../../../packages/web-scraping/src/proxy/ProxyService.js';

// Initialize proxy service with security policy
const proxyService = new ProxyService({
  maxFileSize: 5 * 1024 * 1024, // 5MB limit for serverless
  rateLimit: {
    requests: 30,
    windowMs: 60000 // 1 minute
  },
  allowedContentTypes: [
    'text/html',
    'text/plain',
    'application/json',
    'application/xml',
    'text/xml'
  ],
  contentFiltering: true
});

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Extract parameters
    const { url, method = 'GET', headers = {}, body } = req.method === 'GET' 
      ? { url: req.query.url as string, method: 'GET', headers: {}, body: undefined }
      : req.body;

    // Validate required parameters
    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL parameter is required'
      });
    }

    // Make proxy request
    const result = await proxyService.proxyRequest({
      url,
      method: method as any,
      headers,
      body,
      config: {
        timeout: 10000 // 10 second timeout for serverless
      }
    });

    // Return result
    res.status(result.statusCode).json(result);

  } catch (error) {
    console.error('Proxy error:', error);
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      metadata: {
        timestamp: new Date().toISOString(),
        function: 'proxy'
      }
    });
  }
}