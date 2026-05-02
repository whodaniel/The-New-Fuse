export type ReceiptType =
  | 'deposit'
  | 'withdraw'
  | 'state_change'
  | 'note'
  | 'check'
  | 'stall'
  | 'handoff'
  | 'sync';

export type ReceiptVisibility = 'private' | 'team' | 'public';

export type ReceiptReferenceKind = 'file' | 'url' | 'snapshot' | 'diff' | 'task';

export interface ReceiptScope {
  runtime: string;
  agent: string;
  session?: string;
}

export interface ReceiptPermission {
  visibility?: ReceiptVisibility;
  writeScope?: string;
}

export interface ReceiptReference {
  kind: ReceiptReferenceKind;
  ref: string;
  sha256?: string;
}

export interface Receipt {
  id: string;
  ts: string;
  type: ReceiptType;
  by: string;
  scope: ReceiptScope;
  perm?: ReceiptPermission;
  refs?: ReceiptReference[];
  data: Record<string, unknown>;
  prevHash?: string;
  hash?: string;
}

export interface DepositResponse {
  ok: boolean;
  receipt: Receipt;
  receiptLog: string;
  sequencer?: unknown;
}

export type SharedStateDepositRequest = Partial<Receipt>;

export type SharedStateContextResponse = Record<string, unknown>;

export interface SharedStateHealthResponse {
  status: string;
  error?: string;
  [key: string]: unknown;
}
