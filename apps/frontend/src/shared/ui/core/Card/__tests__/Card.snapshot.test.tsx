import React from 'react';
import { assertSnapshot } from '@/test/helpers/snapshot';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../Card.js';

describe('Card Snapshots', () => {
  it('renders basic card correctly', () => {
    assertSnapshot(
      <Card>
        <CardContent>Basic Card Content</CardContent>
      </Card>
    );
  });

  it('renders full featured card correctly', () => {
    assertSnapshot(
      <Card>
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>This is a card description</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Some content goes here</p>
        </CardContent>
        <CardFooter>
          <p>Footer content</p>
        </CardFooter>
      </Card>
    );
  });

  it('renders card variants correctly', () => {
    assertSnapshot(
      <>
        <Card variant="default">Default Variant</Card>
        <Card variant="ghost">Ghost Variant</Card>
        <Card variant="outline">Outline Variant</Card>
        <Card variant="elevated">Elevated Variant</Card>
      </>
    );
  });

  it('renders different sizes correctly', () => {
    assertSnapshot(
      <>
        <Card size="sm">Small Card</Card>
        <Card size="default">Default Size Card</Card>
        <Card size="lg">Large Card</Card>
      </>
    );
  });

  it('renders with custom className', () => {
    assertSnapshot(
      <Card className="custom-class">
        <CardContent>Custom Class Card</CardContent>
      </Card>
    );
  });
});