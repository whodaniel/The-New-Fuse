/**
 * Types module for the hooks package
 * Defines all necessary types used by hooks
 */
import { createContext } from 'react';
// Feature and suggestion related enums
export var SuggestionStatus;
(function (SuggestionStatus) {
    SuggestionStatus["NEW"] = "new";
    SuggestionStatus["ACCEPTED"] = "accepted";
    SuggestionStatus["IN_PROGRESS"] = "in_progress";
    SuggestionStatus["COMPLETED"] = "completed";
    SuggestionStatus["REJECTED"] = "rejected";
    SuggestionStatus["DEFERRED"] = "deferred";
    SuggestionStatus["SUBMITTED"] = "submitted";
    SuggestionStatus["UNDER_REVIEW"] = "under_review";
})(SuggestionStatus || (SuggestionStatus = {}));
// Task related enums
export var TaskStatus;
(function (TaskStatus) {
    TaskStatus["PENDING"] = "pending";
    TaskStatus["IN_PROGRESS"] = "in_progress";
    TaskStatus["COMPLETED"] = "completed";
    TaskStatus["BLOCKED"] = "blocked";
})(TaskStatus || (TaskStatus = {}));
export var TaskPriority;
(function (TaskPriority) {
    TaskPriority["LOW"] = "low";
    TaskPriority["MEDIUM"] = "medium";
    TaskPriority["HIGH"] = "high";
    TaskPriority["URGENT"] = "urgent";
})(TaskPriority || (TaskPriority = {}));
export var TaskType;
(function (TaskType) {
    TaskType["FEATURE"] = "feature";
    TaskType["BUG"] = "bug";
    TaskType["IMPROVEMENT"] = "improvement";
    TaskType["DOCUMENTATION"] = "documentation";
    TaskType["OTHER"] = "other";
})(TaskType || (TaskType = {}));
// Create context instances
export const AuthContext = createContext(null);
export const ApiClientContext = createContext(null);
export const WebSocketContext = createContext(null);
export const FeatureToggleContext = createContext(null);
export const SuggestionActionsContext = createContext(null);
