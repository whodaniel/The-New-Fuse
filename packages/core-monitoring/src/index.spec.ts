describe('Core Monitoring Exports', () => {
  it('should be able to import from index', async () => {
    const coreMonitoring = await import('../src');
    expect(coreMonitoring).toBeDefined();
  });
});
