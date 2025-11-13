"use strict";
/**
 * Blockchain/Web3 Integration Types
 *
 * Comprehensive type definitions for blockchain and Web3 integration
 * with The New Fuse AI Agent framework.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Web3ActionType = exports.InteractionStatus = exports.TransactionStatus = exports.SmartContractType = exports.WalletType = exports.Web3Provider = exports.Web3AccountType = void 0;
var Web3AccountType;
(function (Web3AccountType) {
    Web3AccountType["EOA"] = "EOA";
    Web3AccountType["SMART_ACCOUNT"] = "SMART_ACCOUNT";
    Web3AccountType["MULTISIG"] = "MULTISIG";
})(Web3AccountType || (exports.Web3AccountType = Web3AccountType = {}));
var Web3Provider;
(function (Web3Provider) {
    Web3Provider["WEB3AUTH"] = "WEB3AUTH";
    Web3Provider["METAMASK"] = "METAMASK";
    Web3Provider["WALLETCONNECT"] = "WALLETCONNECT";
    Web3Provider["COINBASE_WALLET"] = "COINBASE_WALLET";
    Web3Provider["CUSTOM"] = "CUSTOM";
})(Web3Provider || (exports.Web3Provider = Web3Provider = {}));
var WalletType;
(function (WalletType) {
    WalletType["WEB3AUTH"] = "WEB3AUTH";
    WalletType["METAMASK"] = "METAMASK";
    WalletType["WALLETCONNECT"] = "WALLETCONNECT";
    WalletType["COINBASE"] = "COINBASE";
    WalletType["TRUST_WALLET"] = "TRUST_WALLET";
    WalletType["PHANTOM"] = "PHANTOM";
    WalletType["CUSTOM"] = "CUSTOM";
})(WalletType || (exports.WalletType = WalletType = {}));
var SmartContractType;
(function (SmartContractType) {
    SmartContractType["ERC20"] = "ERC20";
    SmartContractType["ERC721"] = "ERC721";
    SmartContractType["ERC1155"] = "ERC1155";
    SmartContractType["MULTISIG"] = "MULTISIG";
    SmartContractType["DAO"] = "DAO";
    SmartContractType["DeFi"] = "DeFi";
    SmartContractType["CUSTOM"] = "CUSTOM";
})(SmartContractType || (exports.SmartContractType = SmartContractType = {}));
var TransactionStatus;
(function (TransactionStatus) {
    TransactionStatus["PENDING"] = "PENDING";
    TransactionStatus["CONFIRMED"] = "CONFIRMED";
    TransactionStatus["FAILED"] = "FAILED";
    TransactionStatus["DROPPED"] = "DROPPED";
})(TransactionStatus || (exports.TransactionStatus = TransactionStatus = {}));
var InteractionStatus;
(function (InteractionStatus) {
    InteractionStatus["SUCCESS"] = "SUCCESS";
    InteractionStatus["FAILED"] = "FAILED";
    InteractionStatus["REVERTED"] = "REVERTED";
})(InteractionStatus || (exports.InteractionStatus = InteractionStatus = {}));
var Web3ActionType;
(function (Web3ActionType) {
    Web3ActionType["SEND_TRANSACTION"] = "SEND_TRANSACTION";
    Web3ActionType["CALL_CONTRACT"] = "CALL_CONTRACT";
    Web3ActionType["SEND_NOTIFICATION"] = "SEND_NOTIFICATION";
    Web3ActionType["CREATE_WEBHOOK"] = "CREATE_WEBHOOK";
    Web3ActionType["RUN_WORKFLOW"] = "RUN_WORKFLOW";
    Web3ActionType["UPDATE_DATABASE"] = "UPDATE_DATABASE";
    Web3ActionType["CUSTOM"] = "CUSTOM";
})(Web3ActionType || (exports.Web3ActionType = Web3ActionType = {}));
//# sourceMappingURL=web3-types.js.map