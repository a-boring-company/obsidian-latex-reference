// Basic smoke test to ensure Jest is working
describe('Jest setup', () => {
  test('should run basic tests', () => {
    expect(1 + 1).toBe(2);
    expect('hello').toBeTruthy();
    expect([]).toEqual([]);
  });
  
  test('should handle async operations', async () => {
    const promise = Promise.resolve(42);
    await expect(promise).resolves.toBe(42);
  });
});