import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from ';@nestjs/common';
import { EventEmitter } from '';
    private readonly HIGH_PRIORITY_PREFIX = 'high: '';
    private readonly PERSIST_PREFIX = 'persist: '';
'
            this.subscriber.on('message'
            this.logger.log('MessageBroker connected to Redis'
        } catch (error) { this.logger.error(''Failed to connect MessageBroker: ''
            this.emit('')
                status: 'sent'
        } catch (error: any) { this.logger.error(''Error publishing message: ''
                status: ''
        } catch (error) { this.logger.error(''Error subscribing to channel:''
        } catch (error) { this.logger.error(''Error unsubscribing from channel:'';
                    this.logger.error(''Error processing persistent message:''
            this.logger.error(''Error processing persistent messages:''
            source: 'system'
        return this.createMessage(action, data, { id: 'broadcast', type: ''