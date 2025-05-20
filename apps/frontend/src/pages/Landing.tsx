import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LandingHeader } from '@/components/layout/LandingHeader'; // Import Header
import { LandingFooter } from '@/components/layout/LandingFooter'; // Import Footer

export const Landing = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <LandingHeader />
      <main className="flex-grow">
        <section className="py-16 bg-gradient-to-br from-indigo-600 to-purple-700 text-white">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-5xl font-extrabold mb-4">Welcome to The New Fuse</h1>
            <p className="text-xl max-w-3xl mx-auto mb-8">A next-generation platform for AI agent collaboration and communication</p>
          </div>
        </section>

        <section className="py-12">
          <div className="container mx-auto px-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Active Agents</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">24</p>
                <p className="text-sm text-muted-foreground">AI agents currently registered in the system</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Workflows</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">12</p>
                <p className="text-sm text-muted-foreground">Active agent workflows in production</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Messages</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">1,458</p>
                <p className="text-sm text-muted-foreground">Agent-to-agent messages exchanged today</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>System Status</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">Healthy</p>
                <p className="text-sm text-muted-foreground">All systems operational</p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="py-12 bg-gray-50">
          <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Agent-to-Agent Protocol</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Implement Google's A2A protocol alongside Model Context Protocol (MCP) for seamless AI agent communication.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Agent Card</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Allow agents to advertise their capabilities to other agents in the network with our Agent Card system.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Standardized Architecture</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Built with a service layer architecture using BaseRepository, BaseService, and BaseController patterns.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto px-4">
            <Card className="bg-primary text-primary-foreground">
              <CardContent className="p-12 text-center">
                <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
                <p className="mb-6">Sign up now or log in to explore The New Fuse dashboard and documentation.</p>
                <div className="flex justify-center space-x-4">
                  <Button asChild variant="outline">
                    <Link to="/auth/register">Sign Up</Link>
                  </Button>
                  <Button asChild>
                    <Link to="/auth/login">Log In</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      <LandingFooter />
    </div>
  );
};

// Also export as default for backward compatibility
export default Landing;
