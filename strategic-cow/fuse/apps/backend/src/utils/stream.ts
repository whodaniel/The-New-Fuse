import { Response } from 'express';

export class StreamResponse {
  private res: Response;

  constructor(res: Response) {
    this.res = res;
    this.res.setHeader('Content-Type', 'text/plain');
    this.res.setHeader('Transfer-Encoding', 'chunked');
  }

  write(data: string | Buffer): void {
    this.res.write(data);
  }

  end(): void {
    this.res.end();
  }
}