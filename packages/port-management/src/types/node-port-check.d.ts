declare module 'node-port-check' {
  export function checkPort(port: number, host?: string): Promise<void>;
}