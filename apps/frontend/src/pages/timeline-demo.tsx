import React from 'react';
const timelineEvents = [
  {
    id: '1',
    date: '2025-01-01',
    title: 'Project Initiated',
    description:
      'The New Fuse project was started with ambitious goals for multi-agent communication.',
    type: 'milestone',
  },
  {
    id: '2',
    date: '2025-02-15',
    title: 'Core Architecture Completed',
    description: 'Basic framework and routing system implemented.',
    type: 'development',
  },
  {
    id: '3',
    date: '2025-03-01',
    title: 'UI Components Added',
    description: 'Comprehensive component library and design system created.',
    type: 'feature',
  },
  {
    id: '4',
    date: '2025-04-01',
    title: 'Multi-Agent Chat Launched',
    description: 'Real-time chat system with multiple AI agents now functional.',
    type: 'feature',
  },
];

const getTypeColor = (type: string) => {
  switch (type) {
    case 'milestone':
      return 'bg-blue-500';
    case 'development':
      return 'bg-green-500';
    case 'feature':
      return 'bg-purple-500';
    default:
      return 'bg-gray-500';
  }
};

const TimelineDemo: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">📅 Timeline Demo</h1>

      <div className="max-w-4xl mx-auto">
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-300"></div>

          {timelineEvents.map((event, index) => (
            <div key={event.id} className="relative flex items-start mb-8">
              {/* Timeline dot */}
              <div
                className={`flex-shrink-0 w-4 h-4 rounded-full ${getTypeColor(event.type)} border-4 border-white shadow-lg z-10`}
              ></div>

              {/* Content */}
              <div className="ml-6 bg-white rounded-lg shadow-md p-6 flex-grow">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
                  <span className="text-sm text-gray-500">{event.date}</span>
                </div>
                <p className="text-gray-700 mb-2">{event.description}</p>
                <span
                  className={`inline-block px-2 py-1 rounded-full text-xs font-medium text-white ${getTypeColor(event.type)}`}
                >
                  {event.type}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="text-center mt-8">
        <p className="text-gray-600">
          This timeline showcases key milestones in The New Fuse development.
        </p>
      </div>
    </div>
  );
};

export default TimelineDemo;
