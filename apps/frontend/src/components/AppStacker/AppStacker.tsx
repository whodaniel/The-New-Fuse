'use client';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd';
import { motion, AnimatePresence } from 'framer-motion';
const VirtualDevice = ({ app, onClose }) => (<motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
    <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden max-w-2xl w-full max-h-[80vh]">
      <div className="bg-gray-800 p-2 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-red-500"/>
          <div className="w-3 h-3 rounded-full bg-yellow-500"/>
          <div className="w-3 h-3 rounded-full bg-green-500"/>
        </div>
        <button onClick={onClose} className="text-white hover:text-gray-300 transition-colors">
          ✕
        </button>
      </div>

      <div className="p-6 overflow-y-auto max-h-[calc(80vh-4rem)]">
        <h2 className="text-2xl font-bold mb-4">{app.name}</h2>
        <p className="text-gray-600 mb-6">{app.description}</p>

        {app.modules && app.modules.length > 0 && (<div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Modules</h3>
            <div className="flex flex-wrap gap-2">
              {app.modules.map((module, index) => (<span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                  {module}
                </span>))}
            </div>
          </div>)}

        {app.mediaAssets && app.mediaAssets.length > 0 && (<div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Media Assets</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {app.mediaAssets.map((asset, index) => (<div key={index} className="aspect-square rounded-lg bg-gray-100 overflow-hidden">
                  <img src={asset} alt={`Asset ${index + 1}`} className="w-full h-full object-cover"/>
                </div>))}
            </div>
          </div>)}

        {app.socialLinks && app.socialLinks.length > 0 && (<div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Social Links</h3>
            <div className="flex flex-wrap gap-2">
              {app.socialLinks.map((link, index) => (<a key={index} href={link.url} target="_blank" rel="noopener noreferrer" className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-full text-sm transition-colors">
                  {link.name}
                </a>))}
            </div>
          </div>)}
      </div>
    </div>
  </motion.div>);
const DraggableApp = ({ app, index, toggleExpand, openVirtualDevice, droppableId, }) => (<Draggable draggableId={`${droppableId}-${app.id}`} index={index}>
    {(provided) => (<div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className="mb-4">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle>{app.name}</CardTitle>
            <CardDescription>Created by {app.creator}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-2">
              <div className="w-full h-4" style={{ backgroundColor: app.color }}/>
              <div className="flex space-x-2">
                <Button onClick={() => toggleExpand(app.id)} variant="outline">
                  Details
                </Button>
                <Button onClick={() => openVirtualDevice(app)}>Launch</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>)}
  </Draggable>);
export function AppStacker() {
    const [availableApps, setAvailableApps] = useState([
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
    const [stackedApps, setStackedApps] = useState([]);
    const [expandedAppId, setExpandedAppId] = useState(null);
    const [virtualDeviceApp, setVirtualDeviceApp] = useState(null);
    const toggleExpand = (appId) => {
        setExpandedAppId(expandedAppId === appId ? null : appId);
    };
    const openVirtualDevice = (app) => {
        setVirtualDeviceApp(app);
    };
    const closeVirtualDevice = () => {
        setVirtualDeviceApp(null);
    };
    const onDragEnd = (result) => {
        if (!result.destination)
            return;
        const sourceList = result.source.droppableId === 'available' ? availableApps : stackedApps;
        const destList = result.destination.droppableId === 'available' ? availableApps : stackedApps;
        const [removed] = sourceList.splice(result.source.index, 1);
        destList.splice(result.destination.index, 0, removed);
        setAvailableApps([...availableApps]);
        setStackedApps([...stackedApps]);
    };
    return (<div className="container mx-auto p-4">
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h2 className="text-2xl font-bold mb-4">Available Apps</h2>
            <Droppable droppableId="available">
              {(provided) => (<div ref={provided.innerRef} {...provided.droppableProps}>
                  {availableApps.map((app, index) => (<DraggableApp key={app.id} app={app} index={index} toggleExpand={toggleExpand} openVirtualDevice={openVirtualDevice} droppableId="available"/>))}
                  {provided.placeholder}
                </div>)}
            </Droppable>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-4">Stacked Apps</h2>
            <Droppable droppableId="stacked">
              {(provided) => (<div ref={provided.innerRef} {...provided.droppableProps}>
                  {stackedApps.map((app, index) => (<DraggableApp key={app.id} app={app} index={index} toggleExpand={toggleExpand} openVirtualDevice={openVirtualDevice} droppableId="stacked"/>))}
                  {provided.placeholder}
                </div>)}
            </Droppable>
          </div>
        </div>
      </DragDropContext>

      <AnimatePresence>
        {virtualDeviceApp && (<VirtualDevice app={virtualDeviceApp} onClose={closeVirtualDevice}/>)}
      </AnimatePresence>
    </div>);
}
//# sourceMappingURL=AppStacker.js.map