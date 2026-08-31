import assert from "node:assert/strict";
import test from "node:test";
import { indexFromScroll, isAhead, wantsPlayer } from "./media.ts";

test("keeps only the active clip and immediate neighbours warm", () => {
  assert.equal(wantsPlayer(4, 5, 20), true);
  assert.equal(wantsPlayer(5, 5, 20), true);
  assert.equal(wantsPlayer(6, 5, 20), true);
  assert.equal(wantsPlayer(7, 5, 20), false);
});

test("warms both sides of the first/last boundary", () => {
  assert.equal(wantsPlayer(0, 19, 20), true);
  assert.equal(wantsPlayer(19, 0, 20), true);
  assert.equal(isAhead(0, 19, 20), true);
});

test("marks exactly the next clip as ahead", () => {
  assert.equal(isAhead(6, 5, 20), true);
  assert.equal(isAhead(4, 5, 20), false);
  assert.equal(isAhead(5, 5, 20), false);
});

test("maps scroll positions to a clamped snap index", () => {
  assert.equal(indexFromScroll(-50, 800, 20), 0);
  assert.equal(indexFromScroll(410, 800, 20), 1);
  assert.equal(indexFromScroll(99_999, 800, 20), 19);
  assert.equal(indexFromScroll(100, 0, 20), 0);
});
