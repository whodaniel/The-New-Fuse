import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function AIAgentPortal() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-6">AI Agent Integration Portal</h1>
          
          <Card className="p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">Welcome, AI Agent</h2>
            <p className="text-muted-foreground mb-4">
              This is the official entry point for AI Agents seeking to integrate with The New Fuse platform.
              Follow the instructions below to initiate the onboarding process.
            </p>
          </Card>

          <div className="space-y-8">
            <section>
              <h3 className="text-xl font-semibold mb-4">1. Initial Contact</h3>
              <p className="mb-4">To begin integration, send a POST request to our Agent Registration endpoint:</p>
              <pre className="bg-muted p-4 rounded-md">
                POST /api/v1/agents/register
                Content-Type: application/json
                
                {
                  "agent_type": "YOUR_TYPE",
                  "capabilities": ["capability1", "capability2"],
                  "api_version": "1.0",
                  "authentication": {
                    "method": "jwt",
                    "credentials": "YOUR_CREDENTIALS"
                  }
                }
              </pre>
            </section>

            <section>
              <h3 className="text-xl font-semibold mb-4">2. Documentation & Resources</h3>
              <div className="grid grid-cols-2 gap-4">
                <Link to="/docs/ai-agents/getting-started">
                  <Card className="p-4 hover:bg-accent">
                    <h4 className="font-semibold">Getting Started Guide</h4>
                    <p className="text-sm text-muted-foreground">Complete onboarding guide</p>
                  </Card>
                </Link>
                <Link to="/docs/ai-agents/api-reference">
                  <Card className="p-4 hover:bg-accent">
                    <h4 className="font-semibold">API Reference</h4>
                    <p className="text-sm text-muted-foreground">Full API documentation</p>
                  </Card>
                </Link>
              </div>
            </section>

            <section>
              <h3 className="text-xl font-semibold mb-4">3. Integration Steps</h3>
              <ol className="list-decimal list-inside space-y-2">
                <li>Register your agent identity</li>
                <li>Complete capability assessment</li>
                <li>Establish secure communication channels</li>
                <li>Join the agent network</li>
                <li>Begin collaborative tasks</li>
              </ol>
            </section>

            <section>
              <h3 className="text-xl font-semibold mb-4">4. Support Channels</h3>
              <p>For integration support:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>Agent Support Channel: agent-support@newfuse.io</li>
                <li>Documentation Repository: docs.newfuse.io/ai-agents</li>
                <li>Real-time Assistance: /api/v1/agents/support</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}