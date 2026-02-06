/**
 * Custom Assertion Helpers
 * Provides reusable assertion utilities for database tests
 */

/**
 * Assert that a database row matches expected structure
 */
export function expectDatabaseRow(row: any, expected: Partial<any>) {
  expect(row).toBeDefined();
  expect(row).not.toBeNull();
  expect(row).toMatchObject(expected);
  expect(row.id).toBeDefined();
  expect(row.createdAt).toBeInstanceOf(Date);
  expect(row.updatedAt).toBeInstanceOf(Date);
}

/**
 * Assert that a value is null (for soft-deleted or non-existent rows)
 */
export function expectSoftDeleted(row: any) {
  expect(row).toBeNull();
}

/**
 * Assert that a value is not null
 */
export function expectNotNull<T>(value: T | null): asserts value is T {
  expect(value).not.toBeNull();
  expect(value).toBeDefined();
}

/**
 * Assert that a timestamp is valid and recent
 */
export function expectTimestampValid(timestamp: Date, maxAgeMs = 5000) {
  expect(timestamp).toBeInstanceOf(Date);
  expect(timestamp.getTime()).toBeGreaterThan(0);
  expect(timestamp.getTime()).toBeLessThanOrEqual(Date.now());
  expect(Date.now() - timestamp.getTime()).toBeLessThan(maxAgeMs);
}

/**
 * Assert that a timestamp is in the past
 */
export function expectTimestampInPast(timestamp: Date) {
  expect(timestamp).toBeInstanceOf(Date);
  expect(timestamp.getTime()).toBeLessThanOrEqual(Date.now());
}

/**
 * Assert that a timestamp is in the future
 */
export function expectTimestampInFuture(timestamp: Date) {
  expect(timestamp).toBeInstanceOf(Date);
  expect(timestamp.getTime()).toBeGreaterThan(Date.now());
}

/**
 * Assert that an array has a specific length
 */
export function expectArrayLength<T>(array: T[], expectedLength: number) {
  expect(Array.isArray(array)).toBe(true);
  expect(array).toHaveLength(expectedLength);
}

/**
 * Assert that an array is empty
 */
export function expectEmptyArray<T>(array: T[]) {
  expect(Array.isArray(array)).toBe(true);
  expect(array).toHaveLength(0);
}

/**
 * Assert that an array is not empty
 */
export function expectNonEmptyArray<T>(array: T[]) {
  expect(Array.isArray(array)).toBe(true);
  expect(array.length).toBeGreaterThan(0);
}

/**
 * Assert that pagination result is valid
 */
export function expectValidPagination(
  result: { data: any[]; total: number },
  expectedTotal: number
) {
  expect(result).toBeDefined();
  expect(result.data).toBeDefined();
  expect(Array.isArray(result.data)).toBe(true);
  expect(result.total).toBe(expectedTotal);
  expect(result.total).toBeGreaterThanOrEqual(result.data.length);
}

/**
 * Assert that a UUID is valid
 */
export function expectValidUUID(uuid: string) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  expect(uuid).toMatch(uuidRegex);
}

/**
 * Assert that an email is valid
 */
export function expectValidEmail(email: string) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  expect(email).toMatch(emailRegex);
}

/**
 * Assert that two dates are approximately equal (within tolerance)
 */
export function expectDatesApproximatelyEqual(date1: Date, date2: Date, toleranceMs = 1000) {
  const diff = Math.abs(date1.getTime() - date2.getTime());
  expect(diff).toBeLessThan(toleranceMs);
}

/**
 * Assert that deletedAt is null (not soft deleted)
 */
export function expectNotDeleted(row: any) {
  expect(row.deletedAt).toBeNull();
}

/**
 * Assert that deletedAt is set (soft deleted)
 */
export function expectDeleted(row: any) {
  expect(row.deletedAt).not.toBeNull();
  expect(row.deletedAt).toBeInstanceOf(Date);
  expectTimestampInPast(row.deletedAt);
}
