export type ReceiptType =
  | 'deposit'
  | 'withdraw'
  | 'state_change'
  | 'note'
  | 'check'
  | 'stall'
  | 'handoff'
  | 'sync';

export interface Receipt {
  id: string;
  ts: string;
  type: ReceiptType;
  by: string;
  scope: { runtime: string; agent: string; session?: string };
  perm?: { visibility?: 'private' | 'team' | 'public'; writeScope?: string };
  refs?: { kind: 'file' | 'url' | 'snapshot' | 'diff' | 'task'; ref: string; sha256?: string }[];
  data: Record<string, unknown>;
  prevHash?: string;
  hash?: string;
}

export interface DepositResponse {
  ok: boolean;
  receipt: Receipt;
  receiptLog: string;
  sequencer?: any;
}
