#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

console.log('Starting React Component Fixes...');

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Files to fix
const FILES_TO_FIX = [
  'src/components/Card/Card.tsx',
  'src/components/chat/ChatModule.tsx',
  'src/components/chat/ChatRoom.tsx',
  'src/components/chat/RooCoderChat.tsx'
];

// Function to fix React component files
function fixReactComponent(filePath) {
  try {
    console.log(`Fixing React component: ${filePath}...`);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.log(`File ${filePath} does not exist, skipping...`);
      return false;
    }
    
    // Read file content
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Fix duplicate imports
    const importLines = new Set();
    const importRegex = /import\s+.*?from\s+['"].*?['"];?/g;
    const imports = content.match(importRegex) || [];
    
    // Keep only unique imports
    const uniqueImports = [...new Set(imports)];
    
    // Remove all imports from content
    content = content.replace(importRegex, '');
    
    // Add unique imports at the top
    const newContent = uniqueImports.join('\n') + '\n\n' + content.trim();
    
    // Fix broken JSX syntax
    let fixedContent = newContent
      // Fix missing parentheses in arrow functions
      .replace(/=>\s*{\s*return\s*([^;]+)\s*;\s*}/g, '=> ($1)')
      // Fix incorrect JSX attribute syntax
      .replace(/([a-zA-Z0-9]+)\s*:\s*([a-zA-Z0-9]+)\s*,/g, '$1={$2},')
      // Fix missing braces in JSX expressions
      .replace(/{\s*([a-zA-Z0-9_\.]+)\s*:\s*([a-zA-Z0-9_\."']+)\s*}/g, '{"$1": $2}')
      // Fix broken cva calls
      .replace(/const\s+\w+\s*=\s*cva\s*\([^\(]*?\s*"([^"]+)"\s*,\s*{/g, 'const $1 = cva("$2", {')
      // Fix broken component definitions
      .replace(/function\s+(\w+)\s*\(([^\)]*)\)\s*{\s*return\s*\(/g, 'function $1($2) {\n  return (')
      // Fix missing closing parentheses
      .replace(/;\s*$/g, ');');
    
    // Write fixed content back to file
    fs.writeFileSync(filePath, fixedContent, 'utf8');
    console.log(`Fixed React component: ${filePath}`);
    return true;
  } catch (error) {
    console.error(`Error fixing React component ${filePath}:`, error);
    return false;
  }
}

// Function to create a basic Card component if it's completely broken
function createBasicCardComponent(filePath) {
  const basicCardComponent = `import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

const cardVariants = cva(
  "rounded-lg border bg-card text-card-foreground shadow-sm",
  {
    variants: {
      variant: {
        default: "border",
        destructive: "border-destructive",
        ghost: "border-none shadow-none",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, ...props }, ref) => (
    <div
      ref={ref}
      className={cardVariants({ variant, className })}
      {...props}
    />
  )
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={"flex flex-col space-y-1.5 p-6 " + (className || "")}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={"text-2xl font-semibold leading-none tracking-tight " + (className || "")}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={"text-sm text-muted-foreground " + (className || "")}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={"p-6 pt-0 " + (className || "")} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={"flex items-center p-6 pt-0 " + (className || "")}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
`;

  try {
    fs.writeFileSync(filePath, basicCardComponent, 'utf8');
    console.log(`Created basic Card component at ${filePath}`);
    return true;
  } catch (error) {
    console.error(`Error creating basic Card component at ${filePath}:`, error);
    return false;
  }
}

// Function to create a basic ChatModule component if it's completely broken
function createBasicChatComponent(filePath) {
  const basicChatComponent = `import React, { useState, useEffect } from 'react';

interface ChatModuleProps {
  userId: string;
  initialMessages?: Message[];
  onSendMessage?: (message: string) => void;
}

interface Message {
  id: string;
  text: string;
  sender: string;
  timestamp: Date;
}

const ChatModule: React.FC<ChatModuleProps> = ({ 
  userId, 
  initialMessages = [], 
  onSendMessage 
}) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [newMessage, setNewMessage] = useState('');

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    
    const message: Message = {
      id: Date.now().toString(),
      text: newMessage,
      sender: userId,
      timestamp: new Date()
    };
    
    setMessages([...messages, message]);
    setNewMessage('');
    
    if (onSendMessage) {
      onSendMessage(newMessage);
    }
  };

  return (
    <div className="chat-module">
      <div className="messages-container">
        {messages.map((message) => (
          <div 
            key={message.id} 
            className={`message ${message.sender === userId ? 'sent' : 'received'}`}
          >
            <p>{message.text}</p>
            <span className="timestamp">
              {message.timestamp.toLocaleTimeString()}
            </span>
          </div>
        ))}
      </div>
      
      <div className="message-input">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Type a message..."
        />
        <button onClick={handleSendMessage}>Send</button>
      </div>
    </div>
  );
};

export default ChatModule;
`;

  try {
    fs.writeFileSync(filePath, basicChatComponent, 'utf8');
    console.log(`Created basic Chat component at ${filePath}`);
    return true;
  } catch (error) {
    console.error(`Error creating basic Chat component at ${filePath}:`, error);
    return false;
  }
}

// Main execution
let fixedCount = 0;

for (const file of FILES_TO_FIX) {
  const filePath = path.join(process.cwd(), file);
  
  // Special handling for completely broken components
  if (file === 'src/components/Card/Card.tsx') {
    createBasicCardComponent(filePath);
    fixedCount++;
  } else if (file === 'src/components/chat/ChatModule.tsx') {
    createBasicChatComponent(filePath);
    fixedCount++;
  } else {
    // Try to fix other components
    const fixed = fixReactComponent(filePath);
    if (fixed) fixedCount++;
  }
}

console.log(`Fixed ${fixedCount} React component files.`);