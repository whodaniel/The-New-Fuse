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
declare class FineTuningService {
    createFineTuning(data: {
        model: string;
        trainingFile: string;
        validationFile?: string;
        hyperparameters?: {
            epochs?: number;
            batchSize?: number;
            learningRate?: number;
        };
    }): Promise<FineTuningModel>;
    getFineTuning(id: string): Promise<FineTuningModel>;
    listFineTuning(): Promise<FineTuningModel[]>;
    cancelFineTuning(id: string): Promise<void>;
    deleteFineTuning(id: string): Promise<void>;
}
declare const _default: FineTuningService;
export default _default;
