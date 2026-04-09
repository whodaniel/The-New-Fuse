import React from "react";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivityFeed = void 0;
var react_1 = require("react");
var Avatar_1 = require("../../../../core/components/ui/Avatar");
var date_fns_1 = require("date-fns");
var ActivityFeed = function (): JSX.Element _a) {
    var events = _a.events, _b = _a.className, className = _b === void 0 ? '' : _b;
    var getEventIcon = function (): JSX.Element type) {
        switch (type) {
            case 'widget_added':
                return '➕';
            case 'widget_removed':
                return '➖';
            case 'widget_updated':
                return '✏️';
            case 'layout_changed':
                return '📐';
            case 'filter_applied':
                return '🔍';
            case 'data_refreshed':
                return '🔄';
            case 'comment_added':
                return '💬';
            case 'comment_resolved':
                return '✅';
            case 'annotation_added':
                return '📝';
            case 'annotation_resolved':
                return '✓';
            case 'dashboard_shared':
                return '🔗';
            case 'dashboard_exported':
                return '📤';
            default:
                return '•';
        }
    };
    var getEventDescription = function (): JSX.Element event) {
        switch (event.type) {
            case 'widget_added':
                return "added widget \"".concat(event.metadata.widgetName, "\"");
            case 'widget_removed':
                return "removed widget \"".concat(event.metadata.widgetName, "\"");
            case 'widget_updated':
                return "updated widget \"".concat(event.metadata.widgetName, "\"");
            case 'layout_changed':
                return 'updated dashboard layout';
            case 'filter_applied':
                return "applied filter \"".concat(event.metadata.filterName, "\"");
            case 'data_refreshed':
                return 'refreshed dashboard data';
            case 'comment_added':
                return "commented on ".concat(event.metadata.target);
            case 'comment_resolved':
                return "resolved a comment on ".concat(event.metadata.target);
            case 'annotation_added':
                return "added an annotation to ".concat(event.metadata.target);
            case 'annotation_resolved':
                return "resolved an annotation on ".concat(event.metadata.target);
            case 'dashboard_shared':
                return "shared the dashboard with ".concat(event.metadata.recipient);
            case 'dashboard_exported':
                return "exported the dashboard as ".concat(event.metadata.format);
            default:
                return 'performed an action';
        }
    };
    return (<div className={"space-y-4 ".concat(className)}>
      <h3 className="text-lg font-medium text-gray-900">Activity Feed</h3>
      <div className="flow-root">
        <ul className="-mb-8">
          {events.map(function (): JSX.Element event, eventIdx) { return (<li key={event.id}>
              <div className="relative pb-8">
                {eventIdx !== events.length - 1 ? (<span className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"/>) : null}
                <div className="relative flex items-start space-x-3">
                  <div className="relative">
                    <Avatar_1.Avatar src={event.user.avatar} alt={event.user.name} size="sm"/>
                    <span className="absolute -right-1 -bottom-1 bg-white rounded-full p-0.5">
                      <span className="text-sm" role="img" aria-label="Event type">
                        {getEventIcon(event.type)}
                      </span>
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div>
                      <div className="text-sm">
                        <span className="font-medium text-gray-900">
                          {event.user.name}
                        </span>{' '}
                        {getEventDescription(event)}
                      </div>
                      <p className="mt-0.5 text-sm text-gray-500">
                        {(0, date_fns_1.formatDistanceToNow)(new Date(event.timestamp), {
                addSuffix: true,
            })}
                      </p>
                    </div>
                    {event.metadata.details && (<div className="mt-2 text-sm text-gray-700">
                        {event.metadata.details}
                      </div>)}
                  </div>
                </div>
              </div>
            </li>); })}
        </ul>
      </div>
    </div>);
};
exports.ActivityFeed = ActivityFeed;
export {};
