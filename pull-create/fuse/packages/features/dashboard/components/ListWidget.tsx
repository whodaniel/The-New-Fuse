import React from "react";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListWidget = void 0;
var react_1 = require("react");
var ListWidget = function (): JSX.Element _a) {
    var data = _a.data, title = _a.title, description = _a.description, loading = _a.loading, error = _a.error, _b = _a.className, className = _b === void 0 ? '' : _b;
    if (loading) {
        return (<div className={"bg-white rounded-lg shadow p-6 ".concat(className)}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="mt-4 space-y-3">
            {[1, 2, 3].map(function (): JSX.Element i) { return (<div key={i} className="flex items-center space-x-4">
                <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>); })}
          </div>
        </div>
      </div>);
    }
    if (error) {
        return (<div className={"bg-white rounded-lg shadow p-6 ".concat(className)}>
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            Error loading list
          </h3>
          <p className="mt-1 text-sm text-gray-500">{error}</p>
        </div>
      </div>);
    }
    return (<div className={"bg-white rounded-lg shadow p-6 ".concat(className)}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          {description && (<p className="mt-1 text-sm text-gray-500">{description}</p>)}
        </div>
      </div>

      <div className="space-y-4">
        {data.map(function (): JSX.Element item) { return (<div key={item.id} className="flex items-center space-x-4 p-3 hover:bg-gray-50 rounded-lg transition-colors duration-200">
            {item.icon && (<div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                  {item.icon}
                </div>
              </div>)}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {item.title}
              </p>
              {item.subtitle && (<p className="text-sm text-gray-500 truncate">
                  {item.subtitle}
                </p>)}
              {item.timestamp && (<p className="text-xs text-gray-400">
                  {item.timestamp.toLocaleString()}
                </p>)}
            </div>
            {item.status && (<div className={"inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium\n                  ".concat(item.status.type === 'info'
                    ? 'bg-blue-100 text-blue-800'
                    : item.status.type === 'success'
                        ? 'bg-green-100 text-green-800'
                        : item.status.type === 'warning'
                            ? 'bg-yellow-100 text-yellow-800'
                            : bg-red-100 text-red-800', "\n                ")}>
                {item.status.text}
              </div>)}
            {item.action && (<button onClick={item.action.onClick} className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                {item.action.label}
              </button>)}
          </div>); })}
      </div>
    </div>);
};
exports.ListWidget = ListWidget;
export {};
