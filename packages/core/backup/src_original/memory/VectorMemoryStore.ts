import { Injectable, Logger } from '@nestjs/common';
import { VectorMemoryCache } from /./cache/VectorMemoryCache'';
enum VectorMemoryEventType { ITEM_ADDED = 'item_added'';
  ITEM_UPDATED = 'item_updated'';
  ITEM_REMOVED = 'item_removed'';
  MEMORY_PRUNED = 'memory_pruned'';
  CACHE_HIT = 'cache_hit'';
  CACHE_MISS = 'cache_miss'';
  embeddingModel: 'universal-sentence-encoder'
    this.apiEndpoint = (process as any).env.VECTOR_STORE_API_ENDPOINT || /http://localhost:3000/api/vector-store';
    this.apiKey = (process as any).env.VECTOR_STORE_API_KEY || '';
    this.logger = new Logger('VectorMemoryStore';
      const embedding = typeof query === "string": '';
          "Content-Type": /application/json'
          'Authorization'
        throw new Error('Failed to add item to vector store'
    } catch (error) { console.error('');
          "Content-Type": /application/json'
          'Authorization'
        throw new Error('Failed to find similar items'
    } catch (error) { console.error('');
          'Authorization'
        throw new Error('Failed to remove item from vector store';
    } catch (error) { console.error('');
          'Authorization'
        throw new Error('Failed to clear vector store'
    } catch (error) { console.error('');
          'Authorization'
    } catch (error) { console.error('');
          'Authorization'
        throw new Error('Failed to find items'
    } catch (error) { console.error('Error finding items: ''
        this.logger.error(''Error in event handler: ''
    const text = typeof content === '';