var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.ClientBridge = exports.RedisConfig = void 0;
import ioredis_1 from 'ioredis';
import uuid_1 from 'uuid';
import logging_config_1 from './logging_config';
import events_1 from 'events';
var logger = (0, logging_config_1.setupLogging)('redis_client');
var RedisConfig = /** @class */ (function () {
    function RedisConfig(_a) {
        var _b = _a === void 0 ? {} : _a, _c = _b.host, host = _c === void 0 ? 'localhost' : _c, _d = _b.port, port = _d === void 0 ? 6379 : _d, password = _b.password, _e = _b.db, db = _e === void 0 ? 0 : _e, _f = _b.tls, tls = _f === void 0 ? false : _f;
        this.host = host;
        this.port = port;
        this.password = password;
        this.db = db;
        this.tls = tls;
    }
    RedisConfig.prototype.toConnectionOptions = function () {
        return {
            host: this.host,
            port: this.port,
            password: this.password,
            db: this.db,
            tls: this.tls ? {} : undefined,
            lazyConnect: true,
            retryStrategy: function (times) {
                var delay = Math.min(times * 50, 2000);
                return delay;
            },
            reconnectOnError: function (err) {
                var targetError = 'READONLY';
                if (err.message.includes(targetError)) {
                    return true;
                }
                return false;
            }
        };
    };
    return RedisConfig;
}());
exports.RedisConfig = RedisConfig;
var ClientBridge = /** @class */ (function (_super) {
    __extends(ClientBridge, _super);
    function ClientBridge(config, instanceId) {
        var _this = _super.call(this) || this;
        _this.config = config;
        _this.redis = null;
        _this.subscriber = null;
        _this.instanceId = instanceId || (0, uuid_1.v4)();
        _this._isConnected = false;
        _this._shouldRun = false;
        _this.reconnectAttempts = 0;
        _this.maxReconnectAttempts = 5;
        _this.handleMessage = _this.handleMessage.bind(_this);
        _this.handleError = _this.handleError.bind(_this);
        return _this;
    }
    Object.defineProperty(ClientBridge.prototype, "isConnected", {
        get: function () {
            return this._isConnected;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ClientBridge.prototype, "shouldRun", {
        get: function () {
            return this._shouldRun;
        },
        enumerable: false,
        configurable: true
    });
    ClientBridge.prototype.getRedis = function () {
        if (!this.redis) {
            this.redis = new ioredis_1.default(this.config.toConnectionOptions());
            this.setupRedisEventHandlers(this.redis);
        }
        return this.redis;
    };
    ClientBridge.prototype.getSubscriber = function () {
        if (!this.subscriber) {
            this.subscriber = new ioredis_1.default(this.config.toConnectionOptions());
            this.setupRedisEventHandlers(this.subscriber);
        }
        return this.subscriber;
    };
    ClientBridge.prototype.setupRedisEventHandlers = function (client) {
        var _this = this;
        client.on('error', this.handleError);
        client.on('close', function () {
            _this._isConnected = false;
            logger.warn('Redis connection closed');
            _this.emit('disconnected');
        });
        client.on('reconnecting', function (delay) {
            logger.info("Attempting to reconnect in ".concat(delay, "ms"));
        });
        client.on('ready', function () {
            _this._isConnected = true;
            _this.reconnectAttempts = 0;
            logger.info('Redis client ready');
            _this.emit('connected');
        });
    };
    ClientBridge.prototype.handleError = function (error) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        logger.error('Redis error:', error);
                        this._isConnected = false;
                        this.emit('error', error);
                        if (!(this.reconnectAttempts < this.maxReconnectAttempts)) return [3 /*break*/, 2];
                        this.reconnectAttempts++;
                        logger.info("Reconnect attempt ".concat(this.reconnectAttempts, "/").concat(this.maxReconnectAttempts));
                        return [4 /*yield*/, this.reconnect()];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 2:
                        logger.error('Max reconnection attempts reached');
                        return [4 /*yield*/, this.stop()];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    ClientBridge.prototype.reconnect = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, this.disconnect()];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.connect()];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        error_1 = _a.sent();
                        logger.error('Failed to reconnect:', error_1);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    ClientBridge.prototype.handleMessage = function (channel, message) {
        return __awaiter(this, void 0, void 0, function () {
            var parsedMessage;
            return __generator(this, function (_a) {
                try {
                    parsedMessage = JSON.parse(message);
                    this.emit('message', channel, parsedMessage);
                }
                catch (error) {
                    logger.error('Error handling message:', error);
                    this.emit('messageError', error);
                }
                return [2 /*return*/];
            });
        });
    };
    ClientBridge.prototype.connect = function () {
        return __awaiter(this, void 0, void 0, function () {
            var subscriber, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.getRedis().ping()];
                    case 1:
                        _a.sent();
                        subscriber = this.getSubscriber();
                        subscriber.on('message', this.handleMessage);
                        this._isConnected = true;
                        logger.info("Connected to Redis at ".concat(this.config.host, ":").concat(this.config.port));
                        return [2 /*return*/, true];
                    case 2:
                        error_2 = _a.sent();
                        logger.error('Failed to connect to Redis:', error_2);
                        this._isConnected = false;
                        throw error_2;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    ClientBridge.prototype.disconnect = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 5, , 6]);
                        if (!this.subscriber) return [3 /*break*/, 2];
                        this.subscriber.removeListener('message', this.handleMessage);
                        return [4 /*yield*/, this.subscriber.quit()];
                    case 1:
                        _a.sent();
                        this.subscriber = null;
                        _a.label = 2;
                    case 2:
                        if (!this.redis) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.redis.quit()];
                    case 3:
                        _a.sent();
                        this.redis = null;
                        _a.label = 4;
                    case 4:
                        this._isConnected = false;
                        logger.info('Disconnected from Redis');
                        return [3 /*break*/, 6];
                    case 5:
                        error_3 = _a.sent();
                        logger.error('Error disconnecting from Redis:', error_3);
                        throw error_3;
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    ClientBridge.prototype.subscribe = function (channels) {
        return __awaiter(this, void 0, void 0, function () {
            var channelList, error_4;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        channelList = Array.isArray(channels) ? channels : [channels];
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, (_a = this.getSubscriber()).subscribe.apply(_a, channelList)];
                    case 2:
                        _b.sent();
                        logger.info('Subscribed to channels:', channelList);
                        return [3 /*break*/, 4];
                    case 3:
                        error_4 = _b.sent();
                        logger.error('Error subscribing to channels:', error_4);
                        throw error_4;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    ClientBridge.prototype.unsubscribe = function (channels) {
        return __awaiter(this, void 0, void 0, function () {
            var channelList, error_5;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        channelList = Array.isArray(channels) ? channels : [channels];
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, (_a = this.getSubscriber()).unsubscribe.apply(_a, channelList)];
                    case 2:
                        _b.sent();
                        logger.info('Unsubscribed from channels:', channelList);
                        return [3 /*break*/, 4];
                    case 3:
                        error_5 = _b.sent();
                        logger.error('Error unsubscribing from channels:', error_5);
                        throw error_5;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    ClientBridge.prototype.publish = function (channel, message) {
        return __awaiter(this, void 0, void 0, function () {
            var messageString, result, error_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        messageString = JSON.stringify(Object.assign(Object.assign({}, message), { timestamp: new Date().toISOString(), sender: this.instanceId }));
                        return [4 /*yield*/, this.getRedis().publish(channel, messageString)];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result];
                    case 2:
                        error_6 = _a.sent();
                        logger.error('Error publishing message:', error_6);
                        throw error_6;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    ClientBridge.prototype.start = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.connect()];
                    case 1:
                        if (!(_a.sent())) {
                            throw new Error('Failed to connect to Redis');
                        }
                        this._shouldRun = true;
                        logger.info("Bridge started with instance ID: ".concat(this.instanceId));
                        return [2 /*return*/];
                }
            });
        });
    };
    ClientBridge.prototype.stop = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this._shouldRun = false;
                        return [4 /*yield*/, this.disconnect()];
                    case 1:
                        _a.sent();
                        logger.info('Bridge stopped');
                        return [2 /*return*/];
                }
            });
        });
    };
    return ClientBridge;
}(events_1.EventEmitter));
exports.ClientBridge = ClientBridge;
if (require.main === module) {
    var run = function () { return __awaiter(void 0, void 0, void 0, function () {
        var config, bridge, error_7;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    config = new RedisConfig();
                    bridge = new ClientBridge(config);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 7, , 8]);
                    process.on('SIGINT', function () { return __awaiter(void 0, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, bridge.stop()];
                                case 1:
                                    _a.sent();
                                    process.exit(0);
                                    return [2 /*return*/];
                            }
                        });
                    }); });
                    return [4 /*yield*/, bridge.start()];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, bridge.subscribe(['test_channel'])];
                case 3:
                    _a.sent();
                    bridge.on('message', function (channel, message) {
                        logger.info('Received message:', { channel: channel, message: message });
                    });
                    _a.label = 4;
                case 4:
                    if (!bridge.shouldRun) return [3 /*break*/, 6];
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 1000); })];
                case 5:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 6: return [3 /*break*/, 8];
                case 7:
                    error_7 = _a.sent();
                    logger.error('Error running bridge:', error_7);
                    process.exit(1);
                    return [3 /*break*/, 8];
                case 8: return [2 /*return*/];
            }
        });
    }); };
    run();
}
