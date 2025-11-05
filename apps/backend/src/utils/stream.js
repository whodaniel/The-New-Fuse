"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StreamResponse = void 0;
class StreamResponse {
    res;
    constructor(res) {
        this.res = res;
        this.res.setHeader('Content-Type', 'text/plain');
        this.res.setHeader('Transfer-Encoding', 'chunked');
    }
    write(data) {
        this.res.write(data);
    }
    end() {
        this.res.end();
    }
}
exports.StreamResponse = StreamResponse;
//# sourceMappingURL=stream.js.map