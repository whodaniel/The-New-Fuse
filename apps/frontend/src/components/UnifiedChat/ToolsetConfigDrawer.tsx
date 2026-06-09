import { X, Wrench, Shield, Database } from 'lucide-react';

export const ToolsetConfigDrawer = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  return (
    <>
      {/* Backdrop overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 transition-opacity" 
          onClick={onClose}
        />
      )}
      
      {/* Drawer */}
      <div 
        className={`fixed inset-y-0 right-0 w-96 bg-white dark:bg-gray-900 shadow-2xl transform transition-transform duration-300 ease-in-out z-50 flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-800">
          <h2 className="text-lg font-semibold flex items-center">
            <Wrench className="w-5 h-5 mr-2" />
            Toolset Configuration
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 flex-1 overflow-y-auto space-y-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Active MCP Servers</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 border dark:border-gray-800 rounded-lg">
                <div className="flex items-center">
                  <Database className="w-4 h-4 mr-2 text-blue-500" />
                  <span>Postgres Runtime</span>
                </div>
                <input type="checkbox" defaultChecked className="toggle toggle-primary" />
              </div>
              <div className="flex items-center justify-between p-3 border dark:border-gray-800 rounded-lg">
                <div className="flex items-center">
                  <Shield className="w-4 h-4 mr-2 text-green-500" />
                  <span>Browser Automation</span>
                </div>
                <input type="checkbox" className="toggle toggle-primary" />
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Agent Capabilities</h3>
            <div className="space-y-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" defaultChecked className="checkbox checkbox-sm" />
                <span>Auto-execute safe commands</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" defaultChecked className="checkbox checkbox-sm" />
                <span>Web Search Context</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" className="checkbox checkbox-sm" />
                <span>Vision & Image Generation</span>
              </label>
            </div>
          </div>
        </div>

        <div className="p-4 border-t dark:border-gray-800">
          <button className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium">
            Save Configuration
          </button>
        </div>
      </div>
    </>
  );
};
