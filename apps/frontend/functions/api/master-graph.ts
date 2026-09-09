import { handleMasterGraph, type GraphContext } from '../../shared/master-graph-api';

export const onRequest = (context: GraphContext) => handleMasterGraph(context);
