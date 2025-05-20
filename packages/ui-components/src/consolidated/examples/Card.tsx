import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../Card.js';
import { Button } from '../Button.js';

// Basic Card
export const BasicCard = () => (
  <Card className="w-[350px]">
    <CardHeader>
      <CardTitle>Card Title</CardTitle>
      <CardDescription>Card Description</CardDescription>
    </CardHeader>
    <CardContent>
      <p>Card content goes here. This is a basic card layout.</p>
    </CardContent>
  </Card>
);

// Card Variants
export const CardVariants = () => (
  <div className="grid grid-cols-3 gap-4">
    <Card variant="default">
      <CardHeader>
        <CardTitle>Default Card</CardTitle>
      </CardHeader>
      <CardContent>Default variant</CardContent>
    </Card>
    
    <Card variant="destructive">
      <CardHeader>
        <CardTitle>Destructive Card</CardTitle>
      </CardHeader>
      <CardContent>Destructive variant</CardContent>
    </Card>
    
    <Card variant="ghost">
      <CardHeader>
        <CardTitle>Ghost Card</CardTitle>
      </CardHeader>
      <CardContent>Ghost variant</CardContent>
    </Card>
  </div>
);

// Card Sizes
export const CardSizes = () => (
  <div className="grid grid-cols-3 gap-4">
    <Card size="sm">
      <CardHeader>
        <CardTitle>Small Card</CardTitle>
      </CardHeader>
      <CardContent>Compact size</CardContent>
    </Card>
    
    <Card size="default">
      <CardHeader>
        <CardTitle>Default Card</CardTitle>
      </CardHeader>
      <CardContent>Default size</CardContent>
    </Card>
    
    <Card size="lg">
      <CardHeader>
        <CardTitle>Large Card</CardTitle>
      </CardHeader>
      <CardContent>Large size</CardContent>
    </Card>
  </div>
);

// Interactive Card
export const InteractiveCard = () => (
  <Card hover clickable className="w-[350px]">
    <CardHeader>
      <CardTitle>Interactive Card</CardTitle>
      <CardDescription>Click or hover to interact</CardDescription>
    </CardHeader>
    <CardContent>
      <p>This card has hover and click effects.</p>
    </CardContent>
  </Card>
);

// Complex Card Example
export const ComplexCard = () => (
  <Card className="w-[350px]">
    <CardHeader>
      <CardTitle>Team Project</CardTitle>
      <CardDescription>Collaborate with your team members</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        <div className="space-y-2">
          <h4 className="font-medium">Project Status</h4>
          <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full w-2/3 bg-blue-500 rounded-full" />
          </div>
        </div>
        <div>
          <h4 className="font-medium mb-2">Team Members</h4>
          <div className="flex -space-x-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white"
              />
            ))}
          </div>
        </div>
      </div>
    </CardContent>
    <CardFooter className="flex justify-between">
      <Button variant="ghost">Cancel</Button>
      <Button>View Project</Button>
    </CardFooter>
  </Card>
);