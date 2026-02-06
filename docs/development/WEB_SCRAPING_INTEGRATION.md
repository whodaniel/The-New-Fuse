# Web Scraping Integration for AI Agents

## 🎯 **Overview**

The New Fuse now includes comprehensive web scraping infrastructure that enables
AI agents to have **full internet access** through both simple proxy requests
and complete browser automation. This implementation provides the exact
functionality described in your requirements.

## 🚀 **What's Been Implemented**

### ✅ **Complete Infrastructure**

1. **Simple Proxy (Basic HTML Access)**
   - Fast HTTP requests without JavaScript
   - CORS bypass functionality
   - Content sanitization and security filtering

2. **Full Browser Rendering (Complete View)**
   - Puppeteer-based headless browser automation
   - JavaScript execution and dynamic content loading
   - Screenshot capabilities
   - SPA (Single Page Application) support

3. **Serverless Deployment Ready**
   - Vercel serverless functions at `/api/proxy` and `/api/scrape`
   - Edge-optimized for global deployment
   - Auto-scaling and cost-effective

4. **MCP Integration**
   - 5 ready-to-use MCP tools for AI agents
   - Security policies and rate limiting
   - Comprehensive error handling and monitoring

## 🛠 **Available Tools for AI Agents**

### 1. **Simple Web Scraping** (`scrape_website_simple`)

```json
{
  "name": "scrape_website_simple",
  "description": "Fast HTML scraping without JavaScript",
  "parameters": {
    "url": "https://example.com",
    "extraction": {
      "mainContentOnly": true,
      "maxTextLength": 5000
    }
  }
}
```

### 2. **Full Browser Scraping** (`scrape_website_full`)

```json
{
  "name": "scrape_website_full",
  "description": "Complete page rendering with JavaScript",
  "parameters": {
    "url": "https://spa-app.com",
    "config": {
      "waitForSelector": ".dynamic-content",
      "enableJavaScript": true
    },
    "extraction": {
      "includeScreenshot": true
    }
  }
}
```

### 3. **Auto-Detect Scraping** (`scrape_website_auto`)

```json
{
  "name": "scrape_website_auto",
  "description": "Automatically choose best method",
  "parameters": {
    "url": "https://any-website.com"
  }
}
```

### 4. **CORS Proxy** (`proxy_web_request`)

```json
{
  "name": "proxy_web_request",
  "description": "Bypass CORS restrictions",
  "parameters": {
    "url": "https://api.example.com/data",
    "method": "POST",
    "headers": { "Content-Type": "application/json" },
    "body": "{\"query\": \"search\"}"
  }
}
```

### 5. **Website Analysis** (`analyze_website`)

```json
{
  "name": "analyze_website",
  "description": "Comprehensive site analysis",
  "parameters": {
    "url": "https://example.com",
    "includeScreenshot": true
  }
}
```

## 🔧 **Quick Setup**

### 1. **Install Dependencies**

```bash
pnpm install
```

### 2. **Start MCP Server with Web Scraping**

```bash
# Run the web scraping MCP server
pnpm run packages/mcp-core/examples/web-scraping-server.ts
```

### 3. **Deploy Serverless Functions**

```bash
# Deploy to Vercel (already configured)
vercel deploy
```

### 4. **Test the Integration**

```bash
# Test simple scraping
curl "https://your-app.vercel.app/api/scrape?url=https://example.com&method=simple"

# Test full browser scraping
curl -X POST https://your-app.vercel.app/api/scrape \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "method": "full"}'

# Test proxy
curl -X POST https://your-app.vercel.app/api/proxy \
  -H "Content-Type: application/json" \
  -d '{"url": "https://httpbin.org/json", "method": "GET"}'
```

## 🛡️ **Security Features**

### **Built-in Protection**

- ✅ Domain allowlists/blocklists
- ✅ Private IP address blocking
- ✅ Content type filtering
- ✅ Rate limiting (30 requests/minute)
- ✅ File size limits (5MB)
- ✅ Request sanitization
- ✅ Error message sanitization

### **Configuration Example**

```typescript
const securityPolicy = {
  allowedDomains: ['wikipedia.org', 'github.com', 'stackoverflow.com'],
  blockedDomains: ['facebook.com', 'twitter.com'],
  maxFileSize: 5 * 1024 * 1024, // 5MB
  rateLimit: { requests: 30, windowMs: 60000 },
  contentFiltering: true,
};
```

## 📊 **Performance & Monitoring**

### **Built-in Metrics**

- Request success/failure rates
- Response times
- Resource usage
- Error tracking
- Rate limit monitoring

### **Usage Statistics**

```typescript
// Get scraping statistics
const stats = webTools.getStatistics();
console.log('Success rate:', stats.webScraping.successRate);
console.log('Average response time:', stats.webScraping.averageResponseTime);
```

## 🌐 **Deployment Architecture**

### **Phase 1: Vercel (Current)**

```
AI Agent → Vercel Functions → Target Website
         ↓
    /api/scrape (Full scraping)
    /api/proxy  (Simple proxy)
```

### **Integration with Existing Deployment**

- ✅ Works with current Vercel setup
- ✅ Integrates with MCP infrastructure
- ✅ Uses existing monitoring system
- ✅ Follows security best practices

## 🧪 **Testing the Implementation**

### **1. Test MCP Server**

```bash
# Start the web scraping MCP server
cd packages/mcp-core
pnpm run examples/web-scraping-server.ts
```

### **2. Test Serverless Functions**

```bash
# Test scraping endpoint
curl "http://localhost:3000/api/scrape?url=https://example.com&method=auto"

# Test proxy endpoint
curl -X POST http://localhost:3000/api/proxy \
  -H "Content-Type: application/json" \
  -d '{"url": "https://httpbin.org/json"}'
```

### **3. Test MCP Tools**

```bash
# Call MCP tool directly
curl -X POST http://localhost:3005/tools/call \
  -H "Content-Type: application/json" \
  -d '{
    "name": "scrape_website_auto",
    "arguments": {"url": "https://news.ycombinator.com"}
  }'
```

## 🎯 **AI Agent Usage Examples**

### **Example 1: Research Assistant**

```typescript
// AI agent researching a topic
const result = await mcpClient.callTool('scrape_website_auto', {
  url: 'https://en.wikipedia.org/wiki/Artificial_Intelligence',
});

console.log('Article title:', result.title);
console.log('Main content:', result.text.substring(0, 1000));
```

### **Example 2: News Monitoring**

```typescript
// AI agent monitoring news
const news = await mcpClient.callTool('scrape_website_full', {
  url: 'https://news.ycombinator.com',
  config: { waitForSelector: '.storylink' },
});

console.log('Top stories:', news.links.slice(0, 10));
```

### **Example 3: API Data Access**

```typescript
// AI agent accessing API through proxy
const apiData = await mcpClient.callTool('proxy_web_request', {
  url: 'https://api.github.com/repos/microsoft/vscode',
  method: 'GET',
});

console.log('Repository data:', JSON.parse(apiData.body));
```

## 🔄 **Integration with Existing Systems**

### **MCP Core Integration**

- Uses existing `ToolExecutionEngine` for security and monitoring
- Integrates with `MCPServer` for tool registration
- Leverages existing error handling and logging

### **Deployment Integration**

- Works with current Vercel configuration
- Uses existing environment variables
- Follows established security patterns

### **Monitoring Integration**

- Integrates with core monitoring system
- Uses existing metrics collection
- Follows established logging patterns

## 🚀 **Next Steps**

### **Immediate Usage**

1. **Deploy**: The infrastructure is ready for immediate deployment
2. **Configure**: Set up security policies for your use case
3. **Test**: Use the provided examples to verify functionality
4. **Integrate**: Connect AI agents to the MCP tools

### **Advanced Configuration**

1. **Custom Security Policies**: Tailor domain restrictions
2. **Performance Tuning**: Adjust timeouts and limits
3. **Monitoring Setup**: Configure alerts and dashboards
4. **Scaling**: Move to Phase 2/3 deployment as needed

## ✅ **Summary**

**The New Fuse now has complete web scraping infrastructure that enables AI
agents to:**

- ✅ **Access any website** through simple HTTP or full browser rendering
- ✅ **Bypass CORS restrictions** with serverless proxy functions
- ✅ **Execute JavaScript** and handle dynamic content
- ✅ **Take screenshots** and analyze visual content
- ✅ **Make API calls** through secure proxy
- ✅ **Extract structured data** from any webpage
- ✅ **Operate securely** with comprehensive security policies
- ✅ **Scale automatically** with serverless deployment
- ✅ **Monitor performance** with built-in metrics

This implementation provides exactly what you described: **a serverless proxy
that allows AI agents full views of the internet**, with both simple HTML access
and complete browser rendering capabilities.
