'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DragDropContext, Draggable, Droppable, DropResult } from '@hello-pangea/dnd';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import React, { useState } from 'react';

interface App {
  id: number;
  name: string;
  description: string;
  creator: string;
  color: string;
  modules?: string[];
  mediaAssets?: string[];
  socialLinks?: { name: string; url: string }[];
}

interface VirtualDeviceProps {
  app: App;
  onClose: () => void;
}

const VirtualDevice: React.FC<VirtualDeviceProps> = ({ app, onClose }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.9 }}
    className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
  >
    <div className="relative bg-transparent rounded-md shadow-none overflow-hidden max-w-2xl w-full max-h-[80vh]">
      <div className="bg-gray-800 p-2 flex items-center justify-between">
        <div className="flex items-center space-x-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
        </div>
        <span className="text-white text-sm font-semibold">{app.name}</span>
        <button onClick={onClose} className="text-white hover:text-gray-300">
          Close
        </button>
      </div>
      <div className="p-4 overflow-y-auto">
        <h2 className="text-2xl font-bold mb-2">{app.name}</h2>
        <p className="text-muted-foreground mb-4">{app.description}</p>
        <div className="space-y-4">
          {app.modules && (
            <div>
              <h3 className="font-semibold">Modules</h3>
              <ul className="list-disc list-inside">
                {app.modules.map((mod) => (
                  <li key={mod}>{mod}</li>
                ))}
              </ul>
            </div>
          )}
          {app.mediaAssets && (
            <div>
              <h3 className="font-semibold">Media</h3>
              <div className="grid grid-cols-2 gap-4">
                {app.mediaAssets.map((asset) => (
                  <img key={asset} src={asset} alt="Media asset" className="rounded-md" />
                ))}
              </div>
            </div>
          )}
          {app.socialLinks && (
            <div>
              <h3 className="font-semibold">Social Links</h3>
              <ul>
                {app.socialLinks.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  </motion.div>
);

interface DraggableAppProps {
  app: App;
  index: number;
  isExpanded: boolean;
  toggleExpand: (id: number) => void;
  openVirtualDevice: (app: App) => void;
  droppableId: string;
}

const DraggableApp: React.FC<DraggableAppProps> = ({
  app,
  index,
  isExpanded,
  toggleExpand,
  openVirtualDevice,
  droppableId,
}) => (
  <Draggable draggableId={`${droppableId}-${app.id}`} index={index}>
    {(provided) => (
      <div
        ref={provided.innerRef}
        {...provided.draggableProps}
        {...provided.dragHandleProps}
        className="mb-4"
      >
        <Card className="hover:shadow-none transition-shadow">
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              {app.name}
              <Button variant="ghost" size="sm" onClick={() => toggleExpand(app.id)} aria-expanded={isExpanded} aria-label={isExpanded ? "Collapse app details" : "Expand app details"}>
                {isExpanded ? <ChevronUp /> : <ChevronDown />}
              </Button>
            </CardTitle>
            <CardDescription>{app.creator}</CardDescription>
          </CardHeader>
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
              >
                <CardContent>
                  <p>{app.description}</p>
                  <Button className="mt-4" onClick={() => openVirtualDevice(app)}>
                    Open in Virtual Device
                  </Button>
                </CardContent>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </div>
    )}
  </Draggable>
));
DraggableApp.displayName = 'DraggableApp';

export function AppStacker() {
  const [availableApps, setAvailableApps] = useState<App[]>([
    {
      id: 1,
      name: 'Cool Chat App',
      description: 'A real-time chat application with modern features',
      creator: 'Alice',
      color: '#ff0000',
      modules: ['Chat', 'Authentication', 'File Sharing'],
      mediaAssets: ['/chat-preview.jpg', '/chat-mobile.jpg'],
      socialLinks: [
        { name: 'GitHub', url: 'https://github.com' },
        { name: 'Demo', url: 'https://demo.app' },
      ],
    },
    {
      id: 2,
      name: 'Awesome Todo List',
      description: 'Stay organized with this beautiful todo app',
      creator: 'Bob',
      color: '#00ff00',
      modules: ['Tasks', 'Categories', 'Reminders'],
    },
    {
      id: 3,
      name: 'Super Calculator',
      description: 'Advanced calculator with scientific functions',
      creator: 'Charlie',
      color: '#0000ff',
      modules: ['Basic Math', 'Scientific', 'Unit Conversion'],
    },
  ]);
  const [stackedApps, setStackedApps] = useState<App[]>([]);
  const [expandedAppId, setExpandedAppId] = useState<number | null>(null);
  const [virtualDeviceApp, setVirtualDeviceApp] = useState<App | null>(null);

  // ⚡ Bolt: Wrapped handlers in useCallback to maintain stable references
  // across renders, enabling DraggableApp's React.memo to work effectively.
  const toggleExpand = React.useCallback((appId: number) => {
    setExpandedAppId(prev => prev === appId ? null : appId);
  }, []);

  const openVirtualDevice = React.useCallback((app: App) => {
    setVirtualDeviceApp(app);
  }, []);

  const closeVirtualDevice = React.useCallback(() => {
    setVirtualDeviceApp(null);
  }, []);

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const sourceList = result.source.droppableId === 'available' ? availableApps : stackedApps;
    const destList = result.destination.droppableId === 'available' ? availableApps : stackedApps;

    const [removed] = sourceList.splice(result.source.index, 1);
    destList.splice(result.destination.index, 0, removed);

    setAvailableApps([...availableApps]);
    setStackedApps([...stackedApps]);
  };

  return (
    <div className="container mx-auto p-4">
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <h2 className="text-2xl font-bold mb-4">Available Apps</h2>
            <Droppable droppableId="available">
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps}>
                  {availableApps.map((app, index) => (
                    <DraggableApp
                      key={app.id}
                      app={app}
                      index={index}
                      isExpanded={expandedAppId === app.id}
                      toggleExpand={toggleExpand}
                      openVirtualDevice={openVirtualDevice}
                      droppableId="available"
                    />
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-4">Stacked Apps</h2>
            <Droppable droppableId="stacked">
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps}>
                  {stackedApps.map((app, index) => (
                    <DraggableApp
                      key={app.id}
                      app={app}
                      index={index}
                      isExpanded={expandedAppId === app.id}
                      toggleExpand={toggleExpand}
                      openVirtualDevice={openVirtualDevice}
                      droppableId="stacked"
                    />
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        </div>
      </DragDropContext>

      <AnimatePresence>
        {virtualDeviceApp && <VirtualDevice app={virtualDeviceApp} onClose={closeVirtualDevice} />}
      </AnimatePresence>
    </div>
  );
}
