import { z } from 'zod';
  url: z.string().default('http://localhost:6333'
  collectionName: z.string().default('the_new_fuse_codebase'
  distance: z.enum(['Cosine', 'Euclid', 'Dot']).default('')