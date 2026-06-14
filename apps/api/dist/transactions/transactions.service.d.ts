import { DatabaseService } from '@the-new-fuse/database';
import { SmartAccountService } from '../smart-accounts/smart-account.service';
import { Web3authService } from '../web3auth/web3auth.service';
export declare class TransactionsService {
    private readonly web3authService;
    private readonly db;
    private readonly smartAccountService;
    private readonly logger;
    constructor(web3authService: Web3authService, db: DatabaseService, smartAccountService: SmartAccountService);
    private getSmartAccountCapability;
    buildAndSignUserOpForAI(agentVerifierId: string, userOpData: {
        to: string;
        value: string;
        data?: string;
        chainId?: number;
    }): Promise<{
        userOpHash: string;
        transactionRecord: {
            type: "TRANSFER" | "CONTRACT_CALL" | "CONTRACT_DEPLOYMENT" | "NFT_MINT" | "NFT_TRANSFER";
            status: "FAILED" | "PENDING" | "CANCELLED" | "CONFIRMED";
            id: string;
            createdAt: Date;
            data: unknown;
            value: string;
            blockNumber: number | null;
            hash: string;
            walletId: string;
            fromAddress: string;
            toAddress: string;
            gasPrice: string;
            gasUsed: number;
            gasLimit: number;
            blockHash: string | null;
            confirmedAt: Date | null;
        };
    }>;
    private getSmartAccountAddress;
    private buildUserOperation;
    private signUserOperation;
    private submitUserOperation;
    private encodeExecuteCall;
    private getNonce;
    private getUserOperationHash;
    executeTransaction(walletId: string, transactionData: {
        to: string;
        value: string;
        data?: string;
        useSmartAccount?: boolean;
    }): Promise<{
        txHash: string;
        transactionRecord: {
            type: "TRANSFER" | "CONTRACT_CALL" | "CONTRACT_DEPLOYMENT" | "NFT_MINT" | "NFT_TRANSFER";
            status: "FAILED" | "PENDING" | "CANCELLED" | "CONFIRMED";
            id: string;
            createdAt: Date;
            data: unknown;
            value: string;
            blockNumber: number | null;
            hash: string;
            walletId: string;
            fromAddress: string;
            toAddress: string;
            gasPrice: string;
            gasUsed: number;
            gasLimit: number;
            blockHash: string | null;
            confirmedAt: Date | null;
        };
        method: string;
    }>;
    executeBatchTransaction(walletId: string, batchData: {
        transactions: Array<{
            to: string;
            value: string;
            data?: string;
        }>;
        useSmartAccount?: boolean;
    }): Promise<{
        txHash: string;
        transactionRecords: {
            type: "TRANSFER" | "CONTRACT_CALL" | "CONTRACT_DEPLOYMENT" | "NFT_MINT" | "NFT_TRANSFER";
            status: "FAILED" | "PENDING" | "CANCELLED" | "CONFIRMED";
            id: string;
            createdAt: Date;
            data: unknown;
            value: string;
            blockNumber: number | null;
            hash: string;
            walletId: string;
            fromAddress: string;
            toAddress: string;
            gasPrice: string;
            gasUsed: number;
            gasLimit: number;
            blockHash: string | null;
            confirmedAt: Date | null;
        }[];
        method: string;
    }>;
    private executeEOATransaction;
    private performComplianceCheck;
    private isValidAddress;
    private getRecentTransactions;
    private assessContractRisk;
    private getWalletIdByAddress;
    getTransactionsByWalletId(walletId: string): Promise<{
        type: "TRANSFER" | "CONTRACT_CALL" | "CONTRACT_DEPLOYMENT" | "NFT_MINT" | "NFT_TRANSFER";
        status: "FAILED" | "PENDING" | "CANCELLED" | "CONFIRMED";
        id: string;
        createdAt: Date;
        data: unknown;
        value: string;
        blockNumber: number | null;
        hash: string;
        walletId: string;
        fromAddress: string;
        toAddress: string;
        gasPrice: string;
        gasUsed: number;
        gasLimit: number;
        blockHash: string | null;
        confirmedAt: Date | null;
    }[]>;
    updateTransactionStatus(txHash: string, status: 'SUCCESS' | 'FAILED'): Promise<{
        type: "TRANSFER" | "CONTRACT_CALL" | "CONTRACT_DEPLOYMENT" | "NFT_MINT" | "NFT_TRANSFER";
        status: "FAILED" | "PENDING" | "CANCELLED" | "CONFIRMED";
        id: string;
        createdAt: Date;
        data: unknown;
        value: string;
        blockNumber: number | null;
        hash: string;
        walletId: string;
        fromAddress: string;
        toAddress: string;
        gasPrice: string;
        gasUsed: number;
        gasLimit: number;
        blockHash: string | null;
        confirmedAt: Date | null;
    } | null>;
}
//# sourceMappingURL=transactions.service.d.ts.map