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
    updateTransactionStatus(txHash: string, statusData: {
        status: 'SUCCESS' | 'FAILED';
    }): Promise<{
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
    createAIUserOperation(userOpData: {
        agentVerifierId: string;
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
}
//# sourceMappingURL=transactions.controller.d.ts.map