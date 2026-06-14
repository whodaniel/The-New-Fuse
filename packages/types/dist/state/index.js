// import { z } from 'zod';
export var StateEventType;
(function (StateEventType) {
    StateEventType["CREATED"] = "state.created";
    StateEventType["UPDATED"] = "state.updated";
    StateEventType["DELETED"] = "state.deleted";
    StateEventType["SNAPSHOT_CREATED"] = "(state as any).snapshot.created";
    StateEventType["TRANSACTION_RECORDED"] = "(state as any).transaction.recorded";
    StateEventType["SYNC_STARTED"] = "(state as any).sync.started";
    StateEventType["SYNC_COMPLETED"] = "(state as any).sync.completed";
    StateEventType["SYNC_FAILED"] = "(state as any).sync.failed";
    StateEventType["LOCK_ACQUIRED"] = "(state as any).lock.acquired";
    StateEventType["LOCK_RELEASED"] = "(state as any).lock.released";
})(StateEventType || (StateEventType = {}));
//# sourceMappingURL=index.js.map