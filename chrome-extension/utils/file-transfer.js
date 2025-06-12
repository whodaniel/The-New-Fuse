import { Logger } from './logger';
// Create a file transfer-specific logger
const fileTransferLogger = new Logger({ name: 'FileTransferMain' }); // Main logger for the module
/**
 * Type guard functions to validate message types
 */
function isFileTransferMessage(data) {
    return data && typeof data === 'object' &&
        typeof data.type === 'string' &&
        typeof data.fileId === 'string';
}
function isChunkAckMessage(data) {
    return data.type === 'FILE_CHUNK_ACK' && typeof data.chunkIndex === 'number';
}
function isTransferCompleteMessage(data) {
    return data.type === 'FILE_TRANSFER_COMPLETE';
}
function isTransferErrorMessage(data) {
    return data.type === 'FILE_TRANSFER_ERROR' && typeof data.error === 'string';
}
function isTransferRequestMessage(data) {
    return data.type === 'FILE_TRANSFER_REQUEST' &&
        typeof data.fileName === 'string' &&
        typeof data.fileSize === 'number';
}
function isFileChunkMessage(data) {
    return data.type === 'FILE_CHUNK' &&
        typeof data.chunkIndex === 'number' &&
        typeof data.chunkData === 'string';
}
/**
 * File transfer manager
 */
export class FileTransferManager {
    /**
     * Creates an instance of FileTransferManager.
     * @param {WebSocketManager} wsManager - The WebSocket manager instance for communication.
     * @param {FileTransferOptions} [options={}] - Optional configuration for file transfers.
     */
    constructor(wsManager, options = {}) {
        this.wsManager = wsManager;
        // Default options for the manager, can be overridden by constructor options
        // and then by per-call options if FileTransferOptions from logger.ts allows.
        this.options = {
            chunkSize: 1024 * 64, // 64KB default
            maxRetries: 3,
            retryDelay: 1000,
            ...options // Spread options from constructor
        };
        this.transfers = new Map();
        this.logger = fileTransferLogger; // Use the module-level logger instance
        this.wsManager.addListener('message', this.handleWebSocketMessage.bind(this));
    }
    /**
     * Handles incoming WebSocket messages related to file transfers.
     * @param {any} data - The message data received from the WebSocket.
     * @private
     */
    handleWebSocketMessage(data) {
        if (!isFileTransferMessage(data)) {
            this.logger.debug('FileTransferManager: Received non-standard message or message missing type/fileId, ignoring.', data);
            return;
        }
        const message = data;
        if (isChunkAckMessage(message)) {
            this.handleChunkAck(message);
        }
        else if (isTransferCompleteMessage(message)) {
            this.handleTransferComplete(message);
        }
        else if (isTransferErrorMessage(message)) {
            this.handleTransferError(message);
        }
        else if (isTransferRequestMessage(message)) {
            this.handleTransferRequest(message);
        }
        else if (isFileChunkMessage(message)) {
            this.handleFileChunk(message);
        }
        else if (message.type === 'FILE_TRANSFER_REQUEST_ACK') {
            this.logger.debug(`Received fileTransferRequestAck for file: ${message.fileId}`);
            this.sendNextChunk(message.fileId);
        }
        else if (message.type === 'FILE_TRANSFER_CANCEL') {
            this.handleTransferCancel(message);
        }
        else if (message.type === 'FILE_TRANSFER_ABORT') {
            this.handleTransferAbort(message);
        }
        else if (message.type === 'FILE_TRANSFER_INIT') {
            this.logger.info(`Received fileTransferInit (usually sender-side): ${message.fileId}`);
        }
        else if (message.type === 'FILE_REQUEST_CHUNK') {
            this.logger.info(`Received fileTransferRequestChunk for file: ${message.fileId}`);
            const requestChunkMsg = message;
            this.sendSpecificChunk(requestChunkMsg.fileId, requestChunkMsg.chunkIndex);
        }
        else {
            this.logger.warn(`Received unknown file transfer message type: ${message.type}`, message);
        }
    }
    /**
     * Handles acknowledgment of a received file chunk during an upload.
     * @param {FileTransferChunkAckMessage} data - The chunk acknowledgment message.
     * @private
     */
    handleChunkAck(data) {
        const { fileId, chunkIndex } = data;
        const transfer = this.transfers.get(fileId);
        if (!transfer || transfer.direction !== 'upload') {
            this.logger.warn(`Received chunk ACK for unknown or non-upload file: ${fileId}`);
            return;
        }
        if (transfer.chunks[chunkIndex]) {
            transfer.chunks[chunkIndex].acknowledged = true;
        }
        transfer.progress = (transfer.chunks.filter(c => c.acknowledged).length / transfer.chunks.length) * 100;
        if (transfer.onProgress) {
            transfer.onProgress(transfer.progress);
        }
        if (transfer.chunks.every(c => c.acknowledged)) {
            this.logger.info(`File upload complete: ${transfer.fileName} (${fileId})`);
            // Send a completion message from client to server
            this.wsManager.send({
                type: 'FILE_TRANSFER_COMPLETE', // Corrected from 'fileTransferComplete'
                fileId
            });
            if (transfer.onComplete) {
                transfer.onComplete(fileId, undefined, transfer.fileName, transfer.fileType);
            }
            this.transfers.delete(fileId);
        }
        else {
            // Send next unacknowledged chunk or wait for server to request
            this.sendNextChunk(fileId);
        }
    }
    /**
     * Handles a message indicating the completion of a file transfer.
     * For downloads, this means the sender has confirmed all data is sent.
     * For uploads, this is a confirmation from the receiver.
     * @param {FileTransferCompleteMessage} data - The transfer complete message.
     * @private
     */
    handleTransferComplete(data) {
        const { fileId } = data;
        const transfer = this.transfers.get(fileId);
        if (!transfer) {
            this.logger.warn(`Received transfer complete for unknown file: ${fileId}`);
            return;
        }
        this.logger.info(`File transfer confirmed complete by remote: ${transfer.fileName} (${fileId})`);
        if (transfer.direction === 'download' && transfer.onComplete) {
            const blob = new Blob([transfer.data || new Uint8Array()], { type: transfer.fileType });
            const url = URL.createObjectURL(blob);
            // Note: The consumer of this onComplete callback is responsible for calling
            // URL.revokeObjectURL(url) when the blob URL is no longer needed to free up resources.
            transfer.onComplete(fileId, url, transfer.fileName, transfer.fileType);
        }
        else if (transfer.onComplete) {
            transfer.onComplete(fileId, undefined, transfer.fileName, transfer.fileType);
        }
        this.transfers.delete(fileId);
    }
    /**
     * Handles a message indicating an error occurred during file transfer.
     * @param {FileTransferErrorMessage} data - The transfer error message.
     * @private
     */
    handleTransferError(data) {
        const { fileId, error } = data;
        const transfer = this.transfers.get(fileId);
        if (!transfer) {
            this.logger.warn(`Received transfer error for unknown file: ${fileId}`);
            return;
        }
        this.logger.error(`File transfer error for ${transfer.fileName} (${fileId}): ${error}`);
        if (transfer.onError) {
            transfer.onError(new Error(error));
        }
        this.transfers.delete(fileId);
    }
    /**
     * Handles an incoming request to initiate a file transfer (typically for downloads).
     * @param {FileTransferRequestMessage} data - The file transfer request message.
     * @private
     */
    handleTransferRequest(data) {
        const { fileId, fileName, fileSize, fileType } = data;
        this.logger.info(`Received file transfer request (download): ${fileName} (${fileId})`);
        const transfer = {
            fileId, fileName, fileSize, fileType,
            direction: 'download',
            chunks: [], // Not used for download in this manner
            progress: 0,
            receivedChunks: 0,
            totalChunks: Math.ceil(fileSize / (this.options.chunkSize || (1024 * 64))),
            data: new Uint8Array(fileSize),
            onProgress: this.options.onProgress, // Use global options or allow per-transfer
            onComplete: this.options.onComplete,
            onError: this.options.onError
        };
        this.transfers.set(fileId, transfer);
        // Acknowledge the request and ask for the first chunk
        this.wsManager.send({
            type: 'FILE_TRANSFER_REQUEST_ACK', // Corrected from 'fileTransferRequestAck'
            fileId,
        });
        // Optionally, request the first chunk explicitly if protocol requires
        this.wsManager.send({
            type: 'FILE_REQUEST_CHUNK', // Corrected from 'fileTransferRequestChunk'
            fileId,
            chunkIndex: 0
        });
    }
    /**
     * Handles an incoming file chunk during a download.
     * @param {FileTransferChunkMessage} data - The file chunk message.
     * @private
     */
    handleFileChunk(data) {
        const { fileId, chunkIndex, chunkData, isLast } = data;
        const transfer = this.transfers.get(fileId);
        if (!transfer || transfer.direction !== 'download') {
            this.logger.warn(`Received chunk for unknown or non-download file: ${fileId}`);
            return;
        }
        try {
            // More robust Base64 to Uint8Array conversion
            let chunkBytes;
            try {
                const binaryString = atob(chunkData); // This can throw if chunkData is not valid Base64
                const len = binaryString.length;
                chunkBytes = new Uint8Array(len);
                for (let i = 0; i < len; i++) {
                    chunkBytes[i] = binaryString.charCodeAt(i);
                }
            }
            catch (base64Error) {
                this.logger.error(`Error decoding Base64 chunk data for ${transfer.fileName} (${fileId}), chunk ${chunkIndex}:`, base64Error);
                throw new Error('Invalid chunk data encoding');
            }
            const offset = chunkIndex * (this.options.chunkSize || (1024 * 64));
            if (transfer.data) {
                transfer.data.set(chunkBytes, offset);
            }
            transfer.receivedChunks = (transfer.receivedChunks || 0) + 1;
            if (transfer.totalChunks) {
                transfer.progress = (transfer.receivedChunks / transfer.totalChunks) * 100;
            }
            if (transfer.onProgress) {
                transfer.onProgress(transfer.progress);
            }
            // Acknowledge chunk receipt
            this.wsManager.send({
                type: 'FILE_CHUNK_ACK', // Corrected from 'fileTransferChunkAck'
                fileId,
                chunkIndex,
            });
            if (isLast) {
                this.logger.info(`File download complete: ${transfer.fileName} (${fileId})`);
                // Server/sender should send 'fileTransferComplete', but if isLast is reliable:
                if (transfer.onComplete) {
                    const blob = new Blob([transfer.data || new Uint8Array()], { type: transfer.fileType });
                    const url = URL.createObjectURL(blob);
                    transfer.onComplete(fileId, url, transfer.fileName, transfer.fileType);
                }
                // Wait for explicit fileTransferComplete from sender before deleting transfer
                // this.transfers.delete(fileId);
            }
            else {
                // Request next chunk if protocol is client-driven for chunk requests
                // this.wsManager.send({ type: 'fileTransferRequestChunk', fileId, chunkIndex: chunkIndex + 1 });
            }
        }
        catch (error) {
            this.logger.error(`Error processing file chunk for ${transfer.fileName} (${fileId}):`, error);
            if (transfer.onError) {
                transfer.onError(error instanceof Error ? error : new Error('Chunk processing failed'));
            }
            this.transfers.delete(fileId);
            // Notify sender of error
            this.wsManager.send({ type: 'FILE_TRANSFER_ERROR', fileId, error: error.message }); // Corrected from 'fileTransferError'
        }
    }
    /**
     * Handles a message indicating that the remote party has cancelled the transfer.
     * @param {FileTransferCancelMessage} data - The transfer cancel message.
     * @private
     */
    handleTransferCancel(data) {
        const { fileId } = data; // Removed reason as it might not exist on type
        const transfer = this.transfers.get(fileId);
        if (transfer) {
            const reasonMessage = data.reason || 'No reason provided'; // Access reason dynamically
            this.logger.warn(`Transfer ${fileId} cancelled by remote. Reason: ${reasonMessage}`);
            if (transfer.onError) { // Or a specific onCancel callback
                transfer.onError(new Error(`Transfer cancelled by remote: ${reasonMessage}`));
            }
            this.transfers.delete(fileId);
        }
        else {
            this.logger.warn(`Received cancel for unknown transfer: ${fileId}`);
        }
    }
    /**
     * Handles a message indicating that the remote party has aborted the transfer.
     * @param {FileTransferAbortMessage} data - The transfer abort message.
     * @private
     */
    handleTransferAbort(data) {
        const { fileId, reason } = data; // Destructure reason
        const transfer = this.transfers.get(fileId);
        if (transfer) {
            const abortReason = reason || 'No reason provided';
            this.logger.warn(`Transfer ${fileId} aborted by remote. Reason: ${abortReason}`);
            if (transfer.onError) { // Or a specific onAbort callback
                transfer.onError(new Error(`Transfer aborted by remote: ${abortReason}`));
            }
            this.transfers.delete(fileId);
        }
        else {
            this.logger.warn(`Received abort for unknown transfer: ${fileId}. Reason: ${reason || 'No reason provided'}`);
        }
    }
    /**
     * Initiates a file upload.
     * @param {File} file - The file object to upload.
     * @param {Partial<FileTransferOptions>} [options={}] - Optional per-transfer options.
     * @returns {string} The unique ID assigned to this file transfer.
     */
    uploadFile(file, options = {}) {
        const fileId = `upload_${file.name}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        this.logger.info(`Initiating upload: ${file.name} (${fileId})`);
        const reader = new FileReader();
        reader.onload = () => {
            const fileData = new Uint8Array(reader.result);
            const effectiveChunkSize = options.chunkSize || this.options.chunkSize || (1024 * 64);
            const chunks = [];
            for (let i = 0; i < fileData.length; i += effectiveChunkSize) {
                chunks.push({
                    index: chunks.length,
                    data: fileData.slice(i, i + effectiveChunkSize),
                    acknowledged: false,
                    retries: 0 // Initialize retries to 0 for each new chunk
                });
            }
            const transfer = {
                fileId,
                fileName: file.name,
                fileSize: file.size,
                fileType: file.type,
                direction: 'upload',
                chunks,
                nextChunkIndex: 0,
                progress: 0,
                onProgress: options.onProgress || this.options.onProgress,
                onComplete: options.onComplete || this.options.onComplete,
                onError: options.onError || this.options.onError
            };
            this.transfers.set(fileId, transfer);
            // Send file initiation message to the server
            this.wsManager.send({
                type: 'FILE_TRANSFER_INIT', // Corrected from 'fileTransferInit'
                fileId,
                fileName: file.name,
                fileSize: file.size,
                fileType: file.type,
            });
        };
        reader.onerror = (_errorEvent) => {
            this.logger.error(`Error reading file ${file.name} for upload:`, reader.error);
            const errCallback = options.onError || this.options.onError;
            if (errCallback) {
                errCallback(reader.error || new Error('Unknown file read error'));
            }
        };
        reader.readAsArrayBuffer(file);
        return fileId;
    }
    /**
     * Sends a specific chunk of a file during an upload.
     * This is typically called when the server requests a particular chunk (e.g., for retries).
     * @param {string} fileId - The ID of the file transfer.
     * @param {number} chunkIndex - The index of the chunk to send.
     * @private
     */
    sendSpecificChunk(fileId, chunkIndex) {
        const transfer = this.transfers.get(fileId);
        if (!transfer || transfer.direction !== 'upload') {
            this.logger.warn(`Cannot send specific chunk for non-upload/unknown transfer: ${fileId}`);
            return;
        }
        if (chunkIndex < 0 || chunkIndex >= transfer.chunks.length) {
            this.logger.error(`Requested chunk index ${chunkIndex} out of bounds for ${fileId}`);
            this.wsManager.send({ type: 'FILE_TRANSFER_ERROR', fileId, error: 'Chunk index out of bounds' });
            return;
        }
        const chunk = transfer.chunks[chunkIndex];
        const maxRetries = this.options.maxRetries || 3;
        if (chunk.retries < maxRetries) {
            chunk.retries++;
            this.logger.debug(`Retrying chunk ${chunkIndex} for ${fileId}, attempt ${chunk.retries}`);
        }
        else {
            this.logger.error(`Max retries reached for chunk ${chunkIndex} of file ${fileId}`);
            this.wsManager.send({ type: 'FILE_TRANSFER_ERROR', fileId, error: `Max retries for chunk ${chunkIndex}` });
            if (transfer.onError)
                transfer.onError(new Error(`Max retries reached for chunk ${chunkIndex}`));
            this.transfers.delete(fileId);
            return;
        }
        const originalNextChunkIndex = transfer.nextChunkIndex;
        transfer.nextChunkIndex = chunkIndex;
        this.sendNextChunkLogic(fileId);
        transfer.nextChunkIndex = originalNextChunkIndex; // Restore, or let sendNextChunk manage it
    }
    /**
     * Contains the core logic for sending the current `nextChunkIndex` chunk.
     * @param {string} fileId - The ID of the file transfer.
     * @private
     */
    sendNextChunkLogic(fileId) {
        const transfer = this.transfers.get(fileId);
        if (!this.validateTransferForChunkSend(transfer, fileId)) {
            return;
        }
        // We can assert these are defined since validateTransferForChunkSend checks them
        const chunkIndex = transfer.nextChunkIndex;
        const chunk = transfer.chunks[chunkIndex];
        // Skip if already acknowledged
        if (chunk.acknowledged) {
            transfer.nextChunkIndex++;
            this.sendNextChunk(fileId);
            return;
        }
        try {
            const chunkBase64 = this.encodeChunkToBase64(chunk.data);
            const isLastChunk = chunkIndex === transfer.chunks.length - 1;
            this.wsManager.send({
                type: 'FILE_CHUNK',
                fileId,
                chunkIndex,
                chunkData: chunkBase64,
                isLast: isLastChunk,
            });
            this.logger.debug(`Sent chunk ${chunkIndex} for ${fileId}. IsLast: ${isLastChunk}`);
        }
        catch (error) {
            this.handleChunkSendError(transfer, chunkIndex, error);
        }
    }
    /**
     * Validates a transfer object for chunk sending operations.
     * @param transfer - The transfer object to validate
     * @param fileId - The ID of the transfer
     * @returns true if the transfer is valid for chunk sending
     * @private
     */
    validateTransferForChunkSend(transfer, fileId) {
        if (!transfer) {
            this.logger.warn(`No transfer found for ID: ${fileId}`);
            return false;
        }
        if (transfer.direction !== 'upload') {
            this.logger.warn(`Transfer ${fileId} is not an upload`);
            return false;
        }
        if (transfer.nextChunkIndex === undefined ||
            transfer.nextChunkIndex >= transfer.chunks.length) {
            if (transfer.chunks.every((c) => c.acknowledged)) {
                this.logger.debug(`All chunks acknowledged for ${fileId}`);
            }
            else {
                this.logger.warn(`Invalid nextChunkIndex for ${fileId}: ${transfer.nextChunkIndex}`);
            }
            return false;
        }
        return true;
    }
    /**
     * Encodes chunk data to Base64 format.
     * @param bytes - The chunk data to encode
     * @returns The Base64 encoded string
     * @private
     */
    encodeChunkToBase64(bytes) {
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        try {
            return btoa(binary);
        }
        catch (error) {
            throw new Error(`Failed to encode chunk to Base64: ${error}`);
        }
    }
    /**
     * Handles errors that occur during chunk sending.
     * @param transfer - The transfer object
     * @param chunkIndex - The index of the chunk that failed
     * @param error - The error that occurred
     * @private
     */
    handleChunkSendError(transfer, chunkIndex, error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(`Error sending chunk ${chunkIndex} for ${transfer.fileId}:`, error);
        this.wsManager.send({
            type: 'FILE_TRANSFER_ERROR',
            fileId: transfer.fileId,
            error: `Failed to send chunk ${chunkIndex}: ${errorMessage}`,
        });
        if (transfer.onError) {
            transfer.onError(new Error(`Failed to send chunk ${chunkIndex}: ${errorMessage}`));
        }
    }
    /**
     * Cancels an ongoing file transfer.
     * Notifies the remote party of the cancellation.
     * @param {string} fileId - The ID of the file transfer to cancel.
     * @param {string} [reason="User cancelled"] - The reason for cancellation.
     */
    cancelTransfer(fileId, reason = "User cancelled") {
        const transfer = this.transfers.get(fileId);
        if (!transfer) {
            this.logger.warn(`Cannot cancel unknown file transfer: ${fileId}`);
            return;
        }
        this.logger.info(`Cancelling file transfer: ${fileId}. Reason: ${reason}`);
        this.wsManager.send({
            type: 'FILE_TRANSFER_CANCEL',
            fileId,
            reason
        });
        this.transfers.delete(fileId);
        // Removed incomplete 'if' statement that was here
        if (transfer.onError) { // Optionally, call onError when a transfer is locally cancelled.
            transfer.onError(new Error(`Transfer cancelled by user: ${reason}`));
        }
    }
    /**
     * Get all active transfers
     * @returns Map of active transfers
     */
    getActiveTransfers() {
        return new Map(this.transfers);
    }
}
//# sourceMappingURL=file-transfer.js.map