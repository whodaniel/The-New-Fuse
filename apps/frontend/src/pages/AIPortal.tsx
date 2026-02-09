import React from 'react';

export default function AIPortal() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">AI Agent Portal</h1>
        <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
          Create New Agent
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((agent) => (
          <div key={agent} className="bg-card p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary">A{agent}</span>
                </div>
                <h3 className="font-semibold">Agent {agent}</h3>
              </div>
              <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Active</span>
            </div>
            
            <p className="text-muted-foreground text-sm mb-4">
              This agent specializes in processing and analyzing data using advanced algorithms.
            </p>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Created 2 days ago</span>
              <button className="text-primary hover:underline">View Details</button>
            </div>
          </div>
        ))}
      </div>
      
      <div className="bg-card p-6 rounded-lg shadow-sm border">
        <h2 className="text-xl font-semibold mb-4">Agent Performance</h2>
        <div className="h-64 bg-muted rounded-md flex items-center justify-center">
          <p className="text-muted-foreground">Performance chart will be displayed here</p>
        </div>
      </div>
      
      <div className="bg-card p-6 rounded-lg shadow-sm border">
        <h2 className="text-xl font-semibold mb-4">Agent Communication Log</h2>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((log) => (
            <div key={log} className="flex items-start gap-4 border-b pb-4 last:border-0">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-primary text-xs">A{log}</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">Agent {log}</p>
                  <span className="text-xs text-muted-foreground">1 hour ago</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Completed task analysis and sent results to Agent {log + 1}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
