export class StreamResponse {
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
