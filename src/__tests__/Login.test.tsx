import { describe, it, expect } from 'vitest';

describe('Basic Test Suite', () => {
  it('should pass a basic test', () => {
    expect(1 + 1).toBe(2);
  });

  it('should handle string operations', () => {
    const greeting = 'Hello Vitest';
    expect(greeting).toContain('Vitest');
    expect(greeting.length).toBeGreaterThan(0);
  });

  it('should handle array operations', () => {
    const numbers = [1, 2, 3, 4, 5];
    expect(numbers).toHaveLength(5);
    expect(numbers).toContain(3);
  });

  it('should handle object operations', () => {
    const user = { name: 'Test User', email: 'test@example.com' };
    expect(user).toHaveProperty('name');
    expect(user.email).toBe('test@example.com');
  });
});
