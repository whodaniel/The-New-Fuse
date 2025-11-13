"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentMessageService = void 0;
const common_1 = require("@nestjs/common");
const LoggingService_1 = require("../../services/LoggingService");
let AgentMessageService = class AgentMessageService {
    logger;
    messages = new Map();
    message_history = [];
    statistics;
    max_history_size = 10000;
    constructor(logger) {
        this.logger = logger;
        this.initializeStatistics();
        this.logger.log('AgentMessageService initialized', 'AgentMessageService');
    }
    /**
     * Initialize message statistics
     */
    initializeStatistics() {
        this.statistics = {
            total_messages: 0,
            messages_by_type: {
                command: 0,
                query: 0,
                event: 0,
                response: 0,
                notification: 0,
                heartbeat: 0,
                error: 0,
                debug: 0
            },
            messages_by_priority: {
                low: 0,
                normal: 0,
                high: 0,
                critical: 0,
                emergency: 0
            },
            messages_by_status: {
                created: 0,
                queued: 0,
                routing: 0,
                delivered: 0,
                failed: 0,
                expired: 0,
                cancelled: 0
            },
            average_latency: 0,
            success_rate: 0,
            error_rate: 0
        };
    }
    /**
     * Create a new agent message
     */
    createMessage(sender_id, recipient_id, message_type, content, priority = 'normal', options = {}) {
        const message_id = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)};
    
    const header: MessageHeader = {
      id: message_id,
      version: '1.0',
      timestamp: new Date(),
      sender_id,
      recipient_id,
      message_type,
      priority,
      ttl: options.ttl,
      correlation_id: options.correlation_id,
      reply_to: options.reply_to
    };
    
    const payload: MessagePayload = {
      content_type: options.content_type || 'json',
      content,
      encoding: 'utf8',
      schema_version: '1.0',
      checksum: this.calculateChecksum(content)
    };
    
    const metadata: MessageMetadata = {
      route_history: [sender_id],
      retry_count: 0,
      max_retries: options.max_retries || 3,
      delivery_attempts: [],
      tags: options.tags || [],
      security_context: {
        encryption_enabled: false,
        access_control: [sender_id, recipient_id]
      }
    };
    
    const message: FullAgentMessage = {
      header,
      payload,
      metadata,
      status: 'created'
    };
    
    this.messages.set(message_id, message);
    this.updateStatistics(message);
    `;
        this.logger.log(Message, created, $, { message_id } ` (${message_type}`, from, $, { sender_id }, to, $, { recipient_id }), 'AgentMessageService';
        ;
        return message;
    }
    /**
     * Get message by ID
     */
    getMessage(message_id) {
        return this.messages.get(message_id) || null;
    }
    /**
     * Update message status
     */
    updateMessageStatus(message_id, status, error_message) {
        const message = this.messages.get(message_id);
        if (!message) {
            return false;
        }
        const old_status = message.status;
        message.status = status;
        // Update statistics
        this.statistics.messages_by_status[old_status]--;
        this.statistics.messages_by_status[status]++;
        // Add delivery attempt if applicable
        if (status === 'delivered' || status === 'failed') {
            const attempt = {
                attempt_number: message.metadata.delivery_attempts.length + 1,
                timestamp: new Date(),
                status: status === 'delivered' ? 'delivered' : 'failed',
                error_message
            };
            message.metadata.delivery_attempts.push(attempt);
        }
        `
    this.logger.log(Message status updated: ${message_id}` -  > $;
        {
            status;
        }
        `, 'AgentMessageService');
    return true;
  }

  /**
   * Add route to message history
   */
  addRouteToMessage(message_id: string, route_point: string): boolean {
    const message = this.messages.get(message_id);
    if (!message) {
      return false;
    }
    
    message.metadata.route_history.push(route_point);
    return true;
  }

  /**
   * Increment retry count
   */
  incrementRetryCount(message_id: string): boolean {
    const message = this.messages.get(message_id);
    if (!message) {
      return false;
    }
    
    message.metadata.retry_count++;
    return message.metadata.retry_count <= message.metadata.max_retries;
  }

  /**
   * Validate message format and content
   */
  validateMessage(message: FullAgentMessage): MessageValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Header validation
    if (!message.header.id) errors.push('Message ID is required');
    if (!message.header.sender_id) errors.push('Sender ID is required');
    if (!message.header.recipient_id) errors.push('Recipient ID is required');
    if (!message.header.message_type) errors.push('Message type is required');
    
    // Payload validation
    if (!message.payload.content_type) errors.push('Content type is required');
    if (message.payload.content === undefined || message.payload.content === null) {
      errors.push('Message content is required');
    }
    
    // TTL validation
    if (message.header.ttl && message.header.ttl < Date.now()) {
      warnings.push('Message has expired based on TTL');
    }
    
    // Size validation (example: 1MB limit)
    const message_size = JSON.stringify(message).length;
    if (message_size > 1024 * 1024) {
      warnings.push('Message size exceeds 1MB, consider splitting or compression');
    }
    
    // Retry validation
    if (message.metadata.retry_count > message.metadata.max_retries) {
      errors.push('Message has exceeded maximum retry attempts');
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Create response message
   */
  createResponseMessage(
    original_message: FullAgentMessage,
    response_content: any,
    status: 'success' | 'error' = 'success'
  ): FullAgentMessage {
    return this.createMessage(
      original_message.header.recipient_id,
      original_message.header.sender_id,
      'response',
      {
        status,
        original_message_id: original_message.header.id,
        content: response_content
      },
      original_message.header.priority,
      {
        correlation_id: original_message.header.id,
        content_type: 'json'
      }
    );
  }

  /**
   * Create error message
   */
  createErrorMessage(
    original_message: FullAgentMessage,
    error_code: string,
    error_message: string
  ): FullAgentMessage {
    return this.createMessage(
      original_message.header.recipient_id,
      original_message.header.sender_id,
      'error',
      {
        error_code,
        error_message,
        original_message_id: original_message.header.id,
        timestamp: new Date()
      },
      'high',
      {
        correlation_id: original_message.header.id,
        content_type: 'json'
      }
    );
  }

  /**
   * Archive message to history
   */
  archiveMessage(message_id: string): boolean {
    const message = this.messages.get(message_id);
    if (!message) {
      return false;
    }
    
    // Add to history
    this.message_history.push({ ...message });
    
    // Maintain history size limit
    if (this.message_history.length > this.max_history_size) {
      this.message_history = this.message_history.slice(-this.max_history_size + 1000);
    }
    
    // Remove from active messages
    this.messages.delete(message_id);
    
    return true;
  }

  /**
   * Clean expired messages
   */
  cleanExpiredMessages(): number {
    const current_time = Date.now();
    let cleaned_count = 0;
    
    for (const [message_id, message] of this.messages.entries()) {
      if (message.header.ttl && message.header.ttl < current_time) {
        this.updateMessageStatus(message_id, 'expired');
        this.archiveMessage(message_id);
        cleaned_count++;
      }
    }
    
    if (cleaned_count > 0) {
      this.logger.log(Cleaned ${cleaned_count} expired messages`, 'AgentMessageService';
        ;
    }
};
exports.AgentMessageService = AgentMessageService;
exports.AgentMessageService = AgentMessageService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [LoggingService_1.LoggingService])
], AgentMessageService);
return cleaned_count;
calculateChecksum(content, any);
string;
{
    // Simple checksum implementation
    const content_str = JSON.stringify(content);
    let hash = 0;
    for (let i = 0; i < content_str.length; i++) {
        const char = content_str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
}
updateStatistics(message, FullAgentMessage);
void {
    this: .statistics.total_messages++,
    this: .statistics.messages_by_type[message.header.message_type]++,
    this: .statistics.messages_by_priority[message.header.priority]++,
    this: .statistics.messages_by_status[message.status]++,
    // Calculate success and error rates
    const: delivered = this.statistics.messages_by_status.delivered,
    const: failed = this.statistics.messages_by_status.failed,
    const: total_completed = delivered + failed,
    if(total_completed) { }
} > 0;
{
    this.statistics.success_rate = delivered / total_completed;
    this.statistics.error_rate = failed / total_completed;
}
/**
 * Get messages by criteria
 */
getMessagesByCriteria(criteria, {
    sender_id: string,
    recipient_id: string,
    message_type: MessageType,
    priority: MessagePriority,
    status: MessageStatus,
    tag: string,
    limit: number
});
FullAgentMessage[];
{
    let messages = Array.from(this.messages.values());
    if (criteria.sender_id) {
        messages = messages.filter(m => m.header.sender_id === criteria.sender_id);
    }
    if (criteria.recipient_id) {
        messages = messages.filter(m => m.header.recipient_id === criteria.recipient_id);
    }
    if (criteria.message_type) {
        messages = messages.filter(m => m.header.message_type === criteria.message_type);
    }
    if (criteria.priority) {
        messages = messages.filter(m => m.header.priority === criteria.priority);
    }
    if (criteria.status) {
        messages = messages.filter(m => m.status === criteria.status);
    }
    if (criteria.tag) {
        messages = messages.filter(m => m.metadata.tags.includes(criteria.tag));
    }
    // Sort by timestamp (newest first)
    messages.sort((a, b) => b.header.timestamp.getTime() - a.header.timestamp.getTime());
    if (criteria.limit) {
        messages = messages.slice(0, criteria.limit);
    }
    return messages;
}
/**
 * Get message statistics
 */
getStatistics();
MessageStatistics;
{
    return { ...this.statistics };
}
/**
 * Get message history
 */
getMessageHistory(limit, number = 100);
FullAgentMessage[];
{
    return this.message_history
        .slice(-limit)
        .sort((a, b) => b.header.timestamp.getTime() - a.header.timestamp.getTime());
}
/**
 * Get active messages count
 */
getActiveMessagesCount();
number;
{
    return this.messages.size;
}
/**
 * Get service status
 */
getServiceStatus();
{
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: Record;
}
{
    const stats = this.getStatistics();
    const active_messages = this.getActiveMessagesCount();
    let status;
    if (stats.error_rate > 0.2) {
        status = 'unhealthy';
    }
    else if (stats.error_rate > 0.1 || active_messages > 1000) {
        status = 'degraded';
    }
    else {
        status = 'healthy';
    }
    return {
        status,
        details: {
            active_messages,
            total_messages: stats.total_messages,
            success_rate: stats.success_rate,
            error_rate: stats.error_rate,
            average_latency: stats.average_latency,
            history_size: this.message_history.length
        }
    };
}
exports.default = AgentMessageService;
//# sourceMappingURL=agent-message.js.map