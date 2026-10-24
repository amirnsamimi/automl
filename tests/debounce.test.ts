import { describe, expect, it } from "vitest";
import { debounceDelay } from "@/hooks/use-debounced-callback";

const opts = { wait: 350, maxWait: 800 };

describe("debounceDelay", () => {
  it("waits the quiet period after an isolated keystroke", () => {
    expect(debounceDelay(10_000, 10_000, 0, opts)).toBe(350);
  });

  it("restarts the quiet period on each keystroke within a burst", () => {
    expect(debounceDelay(10_200, 10_000, 0, opts)).toBe(350);
  });

  it("caps a continuous burst at maxWait so results still update while typing", () => {
    expect(debounceDelay(10_600, 10_000, 0, opts)).toBe(200);
    expect(debounceDelay(10_900, 10_000, 0, opts)).toBe(0);
  });

  it("never runs more often than once per maxWait", () => {
    expect(debounceDelay(10_100, 10_100, 10_000, opts)).toBe(700);
  });
});
