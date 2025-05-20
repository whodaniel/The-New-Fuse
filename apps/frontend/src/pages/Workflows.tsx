import React from 'react';

export default function Workflows() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Workflows</h1>
        <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
          Create Workflow
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((workflow) => (
          <div key={workflow} className="bg-card p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Workflow {workflow}</h3>
              <span className={`px-2 py-1 text-xs rounded-full ${
                workflow % 3 === 0 
                  ? 'bg-yellow-100 text-yellow-800' 
                  : 'bg-green-100 text-green-800'
              }`}>
                {workflow % 3 === 0 ? 'Draft' : 'Active'}
              </span>
            </div>
            
            <p className="text-muted-foreground text-sm mb-4">
              This workflow automates the process of data collection, analysis, and reporting.
            </p>
            
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-primary text-xs">A1</span>
              </div>
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-primary text-xs">A2</span>
              </div>
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-primary text-xs">A3</span>
              </div>
              <span className="text-xs text-muted-foreground">+2 more agents</span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Last run: 3 hours ago</span>
              <div className="flex gap-2">
                <button className="text-primary hover:underline">Edit</button>
                <button className="text-primary hover:underline">Run</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="bg-card p-6 rounded-lg shadow-sm border">
        <h2 className="text-xl font-semibold mb-4">Workflow Builder</h2>
        <div className="h-96 bg-muted rounded-md flex items-center justify-center">
          <p className="text-muted-foreground">Workflow builder will be displayed here</p>
        </div>
        <div className="mt-4 flex justify-end">
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
            Open Builder
          </button>
        </div>
      </div>
      
      <div className="bg-card p-6 rounded-lg shadow-sm border">
        <h2 className="text-xl font-semibold mb-4">Recent Executions</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 font-medium">Workflow</th>
                <th className="text-left py-2 font-medium">Status</th>
                <th className="text-left py-2 font-medium">Started</th>
                <th className="text-left py-2 font-medium">Duration</th>
                <th className="text-left py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5].map((execution) => (
                <tr key={execution} className="border-b last:border-0">
                  <td className="py-3">Workflow {execution % 4 + 1}</td>
                  <td className="py-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      execution % 3 === 0 
                        ? 'bg-red-100 text-red-800' 
                        : execution % 3 === 1
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {execution % 3 === 0 ? 'Failed' : execution % 3 === 1 ? 'Running' : 'Completed'}
                    </span>
                  </td>
                  <td className="py-3 text-muted-foreground">{execution} hours ago</td>
                  <td className="py-3 text-muted-foreground">{execution * 2} minutes</td>
                  <td className="py-3">
                    <button className="text-primary hover:underline">View Logs</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
