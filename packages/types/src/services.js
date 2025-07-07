"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceStatus = void 0;
var ServiceStatus;
(function (ServiceStatus) {
    ServiceStatus["RUNNING"] = "RUNNING";
    ServiceStatus["STOPPED"] = "STOPPED";
    ServiceStatus["ERROR"] = "ERROR";
    ServiceStatus["STARTING"] = "STARTING";
    ServiceStatus["STOPPING"] = "STOPPING";
})(ServiceStatus || (exports.ServiceStatus = ServiceStatus = {}));
