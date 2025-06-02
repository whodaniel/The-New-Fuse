                  
                  <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Success Rate</p>
                        <p className="text-2xl font-bold text-green-600">{template.analytics?.successRate}%</p>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg">
                        <Target className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Versions</p>
                        <p className="text-2xl font-bold text-gray-900">{template.versions.length}</p>
                      </div>
                      <div className="p-3 bg-purple-50 rounded-lg">
                        <GitBranch className="h-6 w-6 text-purple-600" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Variables</p>
                        <p className="text-2xl font-bold text-gray-900">{Object.keys(currentVersion?.variables || {}).length}</p>
                      </div>
                      <div className="p-3 bg-orange-50 rounded-lg">
                        <Variable className="h-6 w-6 text-orange-600" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Version Performance Comparison */}
                <div className="bg-white p-6 rounded-lg border border-gray-200 mb-8">
                  <h4 className="text-md font-semibold text-gray-900 mb-4">Version Performance</h4>
                  <div className="space-y-4">
                    {template.versions.map((version) => (
                      <div key={version.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">Version {version.version}</span>
                            <span className={`px-2 py-1 text-xs font-medium border rounded-full ${getLabelStyle(version.label)}`}>
                              {version.label}
                            </span>
                          </div>
                          {version.name && (
                            <span className="text-sm text-gray-600">{version.name}</span>
                          )}
                        </div>
                        
                        {version.metrics && (
                          <div className="flex items-center gap-6 text-sm">
                            <div className="text-center">
                              <p className="text-gray-600">Runs</p>
                              <p className="font-medium">{version.metrics.totalRuns}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-gray-600">Success</p>
                              <p className="font-medium text-green-600">{version.metrics.successRate}%</p>
                            </div>
                            <div className="text-center">
                              <p className="text-gray-600">Avg Time</p>
                              <p className="font-medium">{version.metrics.avgResponseTime}ms</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Popular Variables */}
                {template.analytics?.popularVariables && (
                  <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <h4 className="text-md font-semibold text-gray-900 mb-4">Most Used Variables</h4>
                    <div className="space-y-2">
                      {template.analytics.popularVariables.map((variable, index) => (
                        <div key={variable} className="flex items-center justify-between">
                          <span className="text-sm text-gray-700">{variable}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-32 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${100 - (index * 20)}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-gray-500">{100 - (index * 20)}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModularPromptTemplatingSystem;
