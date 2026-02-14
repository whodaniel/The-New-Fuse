import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ProviderApiKeyList() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Provider API Keys</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Provider</Label>
              <Input placeholder="e.g. OpenAI" />
            </div>
            <div>
              <Label>API Key</Label>
              <Input type="password" placeholder="Enter your API key" />
            </div>
            <div className="flex items-end">
              <Button>Save</Button>
            </div>
          </div>
          <div className="border rounded-md p-4">
            <p className="text-sm text-muted-foreground">No API keys added yet.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
