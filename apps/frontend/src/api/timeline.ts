import axios from 'axios';
import { API_BASE_URL } from '../config';

export const timelineApi = {
  getMacroView: async () => {
    const response = await axios.get(`${API_BASE_URL}/timeline/macro`);
    return response.data;
  },

  getPlanTimeline: async (planId: string) => {
    const response = await axios.get(`${API_BASE_URL}/plans/${planId}`);
    return response.data;
  },

  updateRecordTimeline: async (
    recordId: string,
    data: { startTime?: string; endTime?: string; color?: string }
  ) => {
    const response = await axios.patch(`${API_BASE_URL}/unified-ledger/records/${recordId}`, data);
    return response.data;
  },

  linkRecordToPlan: async (planId: string, recordId: string) => {
    const response = await axios.post(`${API_BASE_URL}/plans/${planId}/link`, { recordId });
    return response.data;
  },
};
