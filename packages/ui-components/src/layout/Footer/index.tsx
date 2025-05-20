import React from 'react';
import { Button, Icon } from '../../shared/ui/index.js';
import { ErrorBoundary } from '../../shared/ui/ErrorBoundary.js';

const Footer: React.FC = () => {
  return (
    <ErrorBoundary>
      <footer className="bg-gray-800 border-t border-gray-700 p-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
              InfiniteAgentSpace
            </h2>
            <p className="text-gray-400 mt-2">Building the future of AI agent development</p>
          </div>
          
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-6">
            <div className="flex space-x-4">
              <Button 
                variant="ghost" 
                size="icon" 
                icon={<Icon name="github" className="h-5 w-5" />}
                aria-label="GitHub"
              />
              <Button 
                variant="ghost" 
                size="icon" 
                icon={<Icon name="twitter" className="h-5 w-5" />}
                aria-label="Twitter"
              />
              <Button 
                variant="ghost" 
                size="icon" 
                icon={<Icon name="mail" className="h-5 w-5" />}
                aria-label="Email"
              />
            </div>
          </div>
        </div>
        
        <div className="mt-8 pt-4 border-t border-gray-700 text-center text-gray-400 text-sm">
          <p>&copy; {new Date().getFullYear()} InfiniteAgentSpace. All rights reserved.</p>
        </div>
      </footer>
    </ErrorBoundary>
  );
};

export default Footer;