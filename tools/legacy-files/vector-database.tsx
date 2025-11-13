import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

interface VectorDocument {
  id: string;
  text: string;
  embedding: number[];
  metadata: Record<string, any>;
}

interface SearchResult {
  id: string;
  text: string;
  score: number;
  metadata: Record<string, any>;
}

export class VectorDatabase {
  private baseUrl: string;
  private apiKey?: string;
  
  constructor(baseUrl: string, apiKey?: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }
  
  private getHeaders() {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }
    
    return headers;
  }
  
  async createCollection(name: string): Promise<boolean> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/collections`,
        { name },
        { headers: this.getHeaders() }
      );
      
      return response.status === 201;
    } catch (error) {
      console.error(`Failed to create collection ${name}:`, error);
      throw error;
    }
  }
  
  async deleteCollection(name: string): Promise<boolean> {
    try {
      const response = await axios.delete(
        `${this.baseUrl}/collections/${name}`,
        { headers: this.getHeaders() }
      );
      
      return response.status === 200;
    } catch (error) {
      console.error(`Failed to delete collection ${name}:`, error);
      throw error;
    }
  }
  
  async listCollections(): Promise<string[]> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/collections`,
        { headers: this.getHeaders() }
      );
      
      return response.data.collections;
    } catch (error) {
      console.error('Failed to list collections:', error);
      throw error;
    }
  }
  
  async storeVector(
    collectionName: string,
    text: string,
    metadata: Record<string, any> = {},
    embeddingModel: string = 'default'
  ): Promise<string> {
    try {
      const id = uuidv4();
      
      const response = await axios.post(
        `${this.baseUrl}/collections/${collectionName}/documents`,
        {
          documents: [
            {
              id,
              text,
              metadata
            }
          ],
          embeddingModel
        },
        { headers: this.getHeaders() }
      );
      
      if (response.status !== 201) {
        throw new Error(`Failed to store vector: ${response.statusText}`);
      }
      
      return id;
    } catch (error) {
      console.error(`Failed to store vector in collection ${collectionName}:`, error);
      throw error;
    }
  }
  
  async updateVector(
    collectionName: string,
    id: string,
    text?: string,
    metadata?: Record<string, any>,
    embeddingModel: string = 'default'
  ): Promise<boolean> {
    try {
      const updateData: any = {};
      
      if (text !== undefined) {
        updateData.text = text;
        updateData.embeddingModel = embeddingModel;
      }
      
      if (metadata !== undefined) {
        updateData.metadata = metadata;
      }
      
      const response = await axios.patch(
        `${this.baseUrl}/collections/${collectionName}/documents/${id}`,
        updateData,
        { headers: this.getHeaders() }
      );
      
      return response.status === 200;
    } catch (error) {
      console.error(`Failed to update vector ${id} in collection ${collectionName}:`, error);
      throw error;
    }
  }
  
  async deleteVector(collectionName: string, id: string): Promise<boolean> {
    try {
      const response = await axios.delete(
        `${this.baseUrl}/collections/${collectionName}/documents/${id}`,
        { headers: this.getHeaders() }
      );
      
      return response.status === 200;
    } catch (error) {
      console.error(`Failed to delete vector ${id} from collection ${collectionName}:`, error);
      throw error;
    }
  }
  
  async search(
    collectionName: string,
    query: string,
    topK: number = 5,
    threshold: number = 0.7,
    filter: Record<string, any> = {},
    embeddingModel: string = 'default'
  ): Promise<SearchResult[]> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/collections/${collectionName}/search`,
        {
          query,
          topK,
          threshold,
          filter,
          embeddingModel
        },
        { headers: this.getHeaders() }
      );
      
      return response.data.results;
    } catch (error) {
      console.error(`Failed to search in collection ${collectionName}:`, error);
      throw error;
    }
  }
  
  async calculateSimilarities(
    texts: string[],
    metric: 'cosine' | 'euclidean' | 'dot' = 'cosine',
    embeddingModel: string = 'default'
  ): Promise<number[][]> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/embeddings/similarities`,
        {
          texts,
          metric,
          embeddingModel
        },
        { headers: this.getHeaders() }
      );
      
      return response.data.similarities;
    } catch (error) {
      console.error('Failed to calculate similarities:', error);
      throw error;
    }
  }
  
  async clusterTexts(
    texts: string[],
    numClusters: number = 3,
    embeddingModel: string = 'default'
  ): Promise<{ clusters: number[], centroids: number[][] }> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/embeddings/cluster`,
        {
          texts,
          numClusters,
          embeddingModel
        },
        { headers: this.getHeaders() }
      );
      
      return {
        clusters: response.data.clusters,
        centroids: response.data.centroids
      };
    } catch (error) {
      console.error('Failed to cluster texts:', error);
      throw error;
    }
  }
  
  async getVector(
    collectionName: string,
    id: string
  ): Promise<VectorDocument | null> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/collections/${collectionName}/documents/${id}`,
        { headers: this.getHeaders() }
      );
      
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return null;
      }
      
      console.error(`Failed to get vector ${id} from collection ${collectionName}:`, error);
      throw error;
    }
  }
}
