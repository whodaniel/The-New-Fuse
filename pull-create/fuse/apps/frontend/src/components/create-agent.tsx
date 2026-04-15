'use client';
import { Label } from '@/components/ui/label';
import { GlassCard, PremiumButton, PremiumInput } from '@/components/ui/premium';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import React, { useState } from 'react';

export function CreateAgent() {
  const [name, setName] = useState('');
  const [type, setType] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setName('');
    setType('');
  };

  return (
    <GlassCard title="Create New Agent" className="w-full max-w-md">
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Agent Name</Label>
            <PremiumInput
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">Agent Type</Label>
            <Select value={type} onValueChange={setType} required>
              <SelectTrigger>
                <SelectValue placeholder="Select agent type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="processor">Processor</SelectItem>
                <SelectItem value="analyzer">Analyzer</SelectItem>
                <SelectItem value="communicator">Communicator</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="mt-4">
          <PremiumButton type="submit" fullWidth>
            Create Agent
          </PremiumButton>
        </div>
      </form>
    </GlassCard>
  );
}
