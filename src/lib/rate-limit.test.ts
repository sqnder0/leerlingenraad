import { describe, it, expect, beforeEach, vi } from "vitest";
import { isLockedOut, recordFailedAttempt, clearAttempts } from "./rate-limit";

describe("login rate limiting", () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it("allows attempts under the threshold", () => {
    const key = `user-${Math.random()}`;
    for (let i = 0; i < 4; i++) recordFailedAttempt(key);
    expect(isLockedOut(key)).toBe(false);
  });

  it("locks out after 5 failed attempts", () => {
    const key = `user-${Math.random()}`;
    for (let i = 0; i < 5; i++) recordFailedAttempt(key);
    expect(isLockedOut(key)).toBe(true);
  });

  it("a successful login clears the counter", () => {
    const key = `user-${Math.random()}`;
    for (let i = 0; i < 5; i++) recordFailedAttempt(key);
    expect(isLockedOut(key)).toBe(true);
    clearAttempts(key);
    expect(isLockedOut(key)).toBe(false);
  });

  it("the window expires after 15 minutes", () => {
    vi.useFakeTimers();
    const key = `user-${Math.random()}`;
    for (let i = 0; i < 5; i++) recordFailedAttempt(key);
    expect(isLockedOut(key)).toBe(true);
    vi.advanceTimersByTime(15 * 60 * 1000 + 1);
    expect(isLockedOut(key)).toBe(false);
    vi.useRealTimers();
  });
});
