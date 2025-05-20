import { AxiosResponse } from 'axios';
import api from '../../lib/api.js';

export interface FineTuningModel {
  id: string;
  status: string;
  model: string;
  baseModel: string;
  trainingFile: string;
  validationFile?: string;
  hyperparameters?: {
    epochs?: number;
    batchSize?: number;
    learningRate?: number;
  };
  createdAt: string;
  updatedAt: string;
  metrics?: {
    trainingLoss?: number;
    validationLoss?: number;
    accuracy?: number;
  };
}

class FineTuningService {
  async createFineTuning(data: {
    model: string;
    trainingFile: string;
    validationFile?: string;
    hyperparameters?: {
      epochs?: number;
      batchSize?: number;
      learningRate?: number;
    };
  }): Promise<FineTuningModel> {
    const response: AxiosResponse<FineTuningModel> = await api.post('/api/fine-tuning', data);
    return response.data;
  }

  async getFineTuning(id: string): Promise<FineTuningModel> {
    const response: AxiosResponse<FineTuningModel> = await api.get(`/api/fine-tuning/${id}`);
    return response.data;
  }

  async listFineTuning(): Promise<FineTuningModel[]> {
    const response: AxiosResponse<FineTuningModel[]> = await api.get('/api/fine-tuning');
    return response.data;
  }

  async cancelFineTuning(id: string): Promise<void> {
    await api.post(`/api/fine-tuning/${id}/cancel`);
  }

  async deleteFineTuning(id: string): Promise<void> {
    await api.delete(`/api/fine-tuning/${id}`);
  }
}

export default new FineTuningService();