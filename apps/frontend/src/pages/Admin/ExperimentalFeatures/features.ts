import LiveSyncToggle from './Features/LiveSync/toggle.js';

export const configurableFeatures = {
  experimental_live_file_sync: {
    title: "Live Document Sync",
    component: LiveSyncToggle,
    key: "experimental_live_file_sync",
  },
};
