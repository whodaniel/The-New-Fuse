import { NodeHandler, WorkflowNode, ExecutionContext } from '../types.js';
import { VectorStore } from '../../vectordb/vector-store.js';
import { EmbeddingService } from '../../vectordb/embedding-service.js';

type VectorStoreOperation = 'store' | 'search' | 'delete' | 'clear';

export class VectorStoreNodeHandler implements NodeHandler {
  private vectorStores: Map<string, VectorStore>;
  private embeddingService: EmbeddingService;
  
  constructor({ 
    vectorStores,
    embeddingService
  }: { 
    vectorStores: Map<string, VectorStore>,
    embeddingService: EmbeddingService
  }) {
    this.vectorStores = vectorStores;
    this.embeddingService = embeddingService;
  }
  
  async execute(node: WorkflowNode, context: ExecutionContext): Promise<Record<string, any>> {
    const { 
      operation,
      storeId,
      documents,
      query,
      queryEmbedding,
      ids,
      namespace,
      options
    } = node.data;
    
    context.logger.debug(`Executing vector store node: ${node.id}`, { 
      operation,
      storeId,
      namespace
    });
    
    // Get the vector store
    const vectorStore = this.vectorStores.get(storeId);
    if (!vectorStore) {
      throw new Error(`Vector store not found: ${storeId}`);
    }
    
    try {
      switch (operation as VectorStoreOperation) {
        case 'store': {
          // Store documents in the vector store
          if (!documents || !Array.isArray(documents)) {
            throw new Error('Documents array is required for store operation');
          }
          
          // Format documents as expected by the vector store
          const formattedDocs = documents.map(doc => ({
            id: doc.id,
            content: doc.content,
            metadata: doc.metadata || {}
          }));
          
          const ids = await vectorStore.storeDocuments(formattedDocs);
          return { 
            success: true, 
            operation: 'store',
            count: ids.length,
            ids
          };
        }
        
        case 'search': {
          // Search for similar documents
          if (!query && !queryEmbedding) {
            throw new Error('Either query text or query embedding is required for search operation');
          }
          
          const searchOptions = options || {};
          if (namespace) {
            searchOptions.namespace = namespace;
          }
          
          const searchQuery = queryEmbedding || query;
          const results = await vectorStore.search(searchQuery, searchOptions);
          
          return {
            success: true,
            operation: 'search',
            count: results.length,
            results
          };
        }
        
        case 'delete': {
          // Delete documents from the vector store
          if (!ids || !Array.isArray(ids)) {
            throw new Error('Document IDs array is required for delete operation');
          }
          
          await vectorStore.deleteDocuments(ids);
          return {
            success: true,
            operation: 'delete',
            count: ids.length
          };
        }
        
        case 'clear': {
          // Clear a namespace in the vector store
          await vectorStore.clearNamespace();
          return {
            success: true,
            operation: 'clear'
          };
        }
        
        default:
          throw new Error(`Unsupported vector store operation: ${operation}`);
      }
    } catch (error) {
      context.logger.error(`Vector store error: ${error.message}`, { operation });
      
      return {
        success: false,
        operation,
        error: error.message
      };
    }
  }
}
