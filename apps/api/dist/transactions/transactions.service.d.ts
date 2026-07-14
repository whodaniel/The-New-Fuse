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
            id: string;
            createdAt: Date;
            data: unknown;
            type: "TRANSFER" | "CONTRACT_CALL" | "CONTRACT_DEPLOYMENT" | "NFT_MINT" | "NFT_TRANSFER";
            status: "FAILED" | "PENDING" | "CANCELLED" | "CONFIRMED";
            value: string;
            walletId: string;
            gasPrice: string;
            hash: string;
            blockHash: string | null;
            blockNumber: number | null;
            gasLimit: number;
            gasUsed: number;
            fromAddress: string;
            toAddress: string;
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
            id: string;
            createdAt: Date;
            data: unknown;
            type: "TRANSFER" | "CONTRACT_CALL" | "CONTRACT_DEPLOYMENT" | "NFT_MINT" | "NFT_TRANSFER";
            status: "FAILED" | "PENDING" | "CANCELLED" | "CONFIRMED";
            value: string;
            walletId: string;
            gasPrice: string;
            hash: string;
            blockHash: string | null;
            blockNumber: number | null;
            gasLimit: number;
            gasUsed: number;
            fromAddress: string;
            toAddress: string;
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
            id: string;
            createdAt: Date;
            data: unknown;
            type: "TRANSFER" | "CONTRACT_CALL" | "CONTRACT_DEPLOYMENT" | "NFT_MINT" | "NFT_TRANSFER";
            status: "FAILED" | "PENDING" | "CANCELLED" | "CONFIRMED";
            value: string;
            walletId: string;
            gasPrice: string;
            hash: string;
            blockHash: string | null;
            blockNumber: number | null;
            gasLimit: number;
            gasUsed: number;
            fromAddress: string;
            toAddress: string;
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
        id: string;
        createdAt: Date;
        data: unknown;
        type: "TRANSFER" | "CONTRACT_CALL" | "CONTRACT_DEPLOYMENT" | "NFT_MINT" | "NFT_TRANSFER";
        status: "FAILED" | "PENDING" | "CANCELLED" | "CONFIRMED";
        value: string;
        walletId: string;
        gasPrice: string;
        hash: string;
        blockHash: string | null;
        blockNumber: number | null;
        gasLimit: number;
        gasUsed: number;
        fromAddress: string;
        toAddress: string;
        confirmedAt: Date | null;
    }[]>;
    updateTransactionStatus(txHash: string, status: 'SUCCESS' | 'FAILED'): Promise<{
        id: string;
        createdAt: Date;
        data: unknown;
        type: "TRANSFER" | "CONTRACT_CALL" | "CONTRACT_DEPLOYMENT" | "NFT_MINT" | "NFT_TRANSFER";
        status: "FAILED" | "PENDING" | "CANCELLED" | "CONFIRMED";
        value: string;
        walletId: string;
        gasPrice: string;
        hash: string;
        blockHash: string | null;
        blockNumber: number | null;
        gasLimit: number;
        gasUsed: number;
        fromAddress: string;
        toAddress: string;
        confirmedAt: Date | null;
    } | null>;
}
//# sourceMappingURL=transactions.service.d.ts.map