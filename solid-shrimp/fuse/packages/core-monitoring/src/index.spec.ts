
describe('Core Monitoring Exports', () => {
  it('should be able to import from index', async () => {
    const coreMonitoring = await import('../src/index');
    expect(coreMonitoring).toBeDefined();
  });
});
