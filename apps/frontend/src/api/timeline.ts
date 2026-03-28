import api from '../services/api';

export const timelineApi = {
  getMacroView: async () => {
    const response = await api.get('/timeline/events');
    return response.data;
  },

  getPlanTimeline: async (planId: string) => {
    const response = await api.get(`/plans/${planId}`);
    return response.data;
  },

  updateRecordTimeline: async (
    recordId: string,
    data: { startTime?: string; endTime?: string; color?: string }
  ) => {
    const response = await api.patch(`/unified-ledger/records/${recordId}`, data);
    return response.data;
  },

  linkRecordToPlan: async (planId: string, recordId: string) => {
    const response = await api.post(`/plans/${planId}/link`, { recordId });
    return response.data;
  },
};
