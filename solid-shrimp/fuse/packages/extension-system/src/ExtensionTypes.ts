/**
 * Extension System Types - The New Fuse
 *
 * This file consolidates the definitions for modules, plugins, and extensions,
 * creating a unified and authoritative source for all extension-related data structures.
 */

// ------------------- Core Extension Enums -------------------

export enum ExtensionType {
  MODULE = 'MODULE',
  PLUGIN = 'PLUGIN',
  INTEGRATION = 'INTEGRATION',
}

export enum ExtensionStatus {
  LOADED = 'LOADED',
  UNLOADED = 'UNLOADED',
  ENABLED = 'ENABLED',
  DISABLED = 'DISABLED',
  ERROR = 'ERROR',
}

// ------------------- Extension Definition -------------------

export interface ExtensionManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  type: ExtensionType;
  
  // Entry point for the extension's code
  entryPoint: string; // e.g., "./dist/main.js"
  
  // Dependencies on other extensions
  dependencies?: string[];
  
  // Host application compatibility
  hostVersion: string; // e.g., ">=1.2.0"
}

export interface Extension<T> {
  manifest: ExtensionManifest;
  status: ExtensionStatus;
  instance?: T;
  error?: string;
  
  // Lifecycle methods
  load: () => Promise<void>;
  unload: () => Promise<void>;
  enable: () => Promise<void>;
  disable: () => Promise<void>;
}

// ------------------- Specific Extension Interfaces -------------------

export interface Module extends Extension<any> {
  // Module-specific properties and methods
  getApi: () => any;
}

export interface Plugin extends Extension<any> {
  // Plugin-specific properties and methods
  getUiComponents: () => any[];
}

export interface Integration extends Extension<any> {
  // Integration-specific properties and methods
  getEventListeners: () => any[];
}
