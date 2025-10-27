// Utility functions
export function isDebug(): boolean {
  return process.env.DEBUG === 'true';
}

export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
