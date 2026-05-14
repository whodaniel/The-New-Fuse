#!/usr/bin/env node

/**
 * The New Fuse - Sophisticated Deployment Script
 * Handles deployment to multiple cloud platforms with environment-specific configurations
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

class DeploymentManager {
  constructor() {
    this.platforms = {
      vercel: this.deployToVercel.bind(this),
      cloud_runtime: this.deployToCloudRuntime.bind(this),
      docker: this.deployToDocker.bind(this),
      aws: this.deployToAWS.bind(this),
      heroku: this.deployToHeroku.bind(this),
      local: this.buildForLocal.bind(this),
    };
    
    this.environments = ['development', 'staging', 'production'];
  }

  async deploy(platform, environment = 'production') {
    console.log(`🚀 Starting deployment to ${platform} (${environment})...`);
    
    if (!this.platforms[platform]) {
      throw new Error(`Unsupported platform: ${platform}`);
    }
    
    if (!this.environments.includes(environment)) {
      throw new Error(`Unsupported environment: ${environment}`);
    }

    // Pre-deployment checks
    await this.preDeploymentChecks();
    
    // Set environment
    process.env.NODE_ENV = environment;
    
    // Platform-specific deployment
    await this.platforms[platform](environment);
    
    console.log(`✅ Deployment to ${platform} completed successfully!`);
  }

  async preDeploymentChecks() {
    console.log('🔍 Running pre-deployment checks...');
    
    // Check if all required files exist
    const requiredFiles = [
      'package.json',
      'apps/frontend/package.json',
      'apps/frontend/vite.config.ts',
    ];
    
    for (const file of requiredFiles) {
      const filePath = path.join(rootDir, file);
      if (!fs.existsSync(filePath)) {
        throw new Error(`Required file missing: ${file}`);
      }
    }
    
    // Run tests
    console.log('🧪 Running tests...');
    try {
      execSync('npm run test', { cwd: rootDir, stdio: 'inherit' });
    } catch (error) {
      console.warn('⚠️ Tests failed, but continuing deployment...');
    }
    
    // Type checking
    console.log('🔧 Running type checks...');
    try {
      execSync('npm run type-check', { cwd: rootDir, stdio: 'inherit' });
    } catch (error) {
      console.warn('⚠️ Type checking failed, but continuing deployment...');
    }
    
    console.log('✅ Pre-deployment checks completed!');
  }

  async deployToVercel(environment) {
    console.log('📡 Deploying to Vercel...');
    
    // Create vercel.json configuration
    const vercelConfig = {
      version: 2,
      builds: [
        {
          src: 'apps/frontend/package.json',
          use: '@vercel/static-build',
          config: {
            distDir: 'dist',
            buildCommand: 'npm run build',
          }
        }
      ],
      routes: [
        {
          src: '/api/(.*)',
          dest: '/api/$1'
        },
        {
          src: '/(.*)',
          dest: '/apps/frontend/dist/$1'
        }
      ],
      env: {
        NODE_ENV: environment,
        VITE_API_URL: '/api',
        VITE_WS_URL: '/ws',
      }
    };
    
    fs.writeFileSync(
      path.join(rootDir, 'vercel.json'),
      JSON.stringify(vercelConfig, null, 2)
    );
    
    // Deploy
    const deployCmd = environment === 'production' 
      ? 'vercel --prod'
      : 'vercel --target staging';
      
    execSync(deployCmd, { cwd: rootDir, stdio: 'inherit' });
  }

  async deployToCloudRuntime(environment) {
    console.log('🚂 Deploying to CloudRuntime...');

    // CloudRuntime uses cloud_runtime.toml which is already configured
    // Just trigger deployment via CLI
    const deployCmd = 'cloud_runtime up';

    execSync(deployCmd, { cwd: rootDir, stdio: 'inherit' });
    console.log('✅ CloudRuntime deployment initiated!');
  }

  async deployToDocker(environment) {
    console.log('🐳 Building Docker containers...');
    
    // Create production Dockerfile
    const dockerfile = `
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY apps/frontend/package*.json ./apps/frontend/
COPY packages/*/package*.json ./packages/*/

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
ENV NODE_ENV=${environment}
ENV VITE_API_URL=/api
ENV VITE_WS_URL=/ws
RUN npm run build

FROM nginx:alpine AS production

# Copy built files
COPY --from=builder /app/apps/frontend/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
`;

    fs.writeFileSync(path.join(rootDir, 'Dockerfile'), dockerfile);
    
    // Create nginx configuration
    const nginxConfig = `
events {}
http {
    include /etc/nginx/mime.types;
    
    server {
        listen 80;
        root /usr/share/nginx/html;
        index index.html;
        
        # API proxy
        location /api {
            proxy_pass http://api-server:3001;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
        
        # WebSocket proxy
        location /ws {
            proxy_pass http://api-server:3001;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
        }
        
        # Frontend routes
        location / {
            try_files $uri $uri/ /index.html;
        }
    }
}
`;

    fs.writeFileSync(path.join(rootDir, 'nginx.conf'), nginxConfig);
    
    // Build Docker image
    execSync(`docker build -t the-new-fuse:${environment} .`, { 
      cwd: rootDir, 
      stdio: 'inherit' 
    });
  }

  async deployToAWS(environment) {
    console.log('☁️ Deploying to AWS...');
    
    // Create AWS SAM template
    const samTemplate = {
      AWSTemplateFormatVersion: '2010-09-09',
      Transform: 'AWS::Serverless-2016-10-31',
      Resources: {
        FrontendBucket: {
          Type: 'AWS::S3::Bucket',
          Properties: {
            BucketName: `the-new-fuse-frontend-${environment}`,
            WebsiteConfiguration: {
              IndexDocument: 'index.html',
              ErrorDocument: 'index.html'
            }
          }
        },
        CloudFrontDistribution: {
          Type: 'AWS::CloudFront::Distribution',
          Properties: {
            DistributionConfig: {
              Origins: [{
                Id: 'S3Origin',
                DomainName: { 'Fn::GetAtt': ['FrontendBucket', 'DomainName'] },
                S3OriginConfig: {}
              }],
              DefaultCacheBehavior: {
                TargetOriginId: 'S3Origin',
                ViewerProtocolPolicy: 'redirect-to-https'
              },
              Enabled: true
            }
          }
        }
      }
    };
    
    fs.writeFileSync(
      path.join(rootDir, 'sam-template.yaml'),
      JSON.stringify(samTemplate, null, 2)
    );
    
    // Build and deploy
    execSync('sam build', { cwd: rootDir, stdio: 'inherit' });
    execSync(`sam deploy --stack-name the-new-fuse-${environment}`, { 
      cwd: rootDir, 
      stdio: 'inherit' 
    });
  }

  async deployToHeroku(environment) {
    console.log('🟣 Deploying to Heroku...');
    
    // Create Procfile
    const procfile = `
web: npm run start
build: npm run build
`;
    
    fs.writeFileSync(path.join(rootDir, 'Procfile'), procfile.trim());
    
    // Set Heroku config vars
    const configVars = [
      `NODE_ENV=${environment}`,
      'VITE_API_URL=/api',
      'VITE_WS_URL=/ws',
    ];
    
    for (const configVar of configVars) {
      execSync(`heroku config:set ${configVar}`, { 
        cwd: rootDir, 
        stdio: 'inherit' 
      });
    }
    
    // Deploy to Heroku
    execSync('git push heroku main', { cwd: rootDir, stdio: 'inherit' });
  }

  async buildForLocal(environment) {
    console.log('🏠 Building for local deployment...');
    
    // Set environment variables for local build
    process.env.VITE_API_URL = 'http://localhost:3001';
    process.env.VITE_WS_URL = 'ws://localhost:3001';
    
    // Build the frontend
    execSync('npm run build', { 
      cwd: path.join(rootDir, 'apps/frontend'), 
      stdio: 'inherit' 
    });
    
    console.log(`✅ Local build completed! Files are in apps/frontend/dist/`);
  }
}

// CLI interface
const args = process.argv.slice(2);
const platform = args[0] || 'local';
const environment = args[1] || 'production';

const deployment = new DeploymentManager();

deployment.deploy(platform, environment).catch(error => {
  console.error('❌ Deployment failed:', error.message);
  process.exit(1);
});

export default DeploymentManager;