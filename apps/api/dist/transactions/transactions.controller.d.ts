import { TransactionsService } from './transactions.service';
export declare class TransactionsController {
    private readonly transactionsService;
    private readonly logger;
    constructor(transactionsService: TransactionsService);
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
    updateTransactionStatus(txHash: string, statusData: {
        status: 'SUCCESS' | 'FAILED';
    }): Promise<{
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
    createAIUserOperation(userOpData: {
        agentVerifierId: string;
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
}
//# sourceMappingURL=transactions.controller.d.ts.map