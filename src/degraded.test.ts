import { test } from 'node:test';
import * as assert from 'node:assert';
import { isDegradedResponse } from './degraded.js';

test('degraded detection', async (t) => {
  await t.test('detects null', () => assert.strictEqual(isDegradedResponse(null), true));
  await t.test('detects empty', () => assert.strictEqual(isDegradedResponse("   "), true));
  await t.test('passes normal', () => assert.strictEqual(isDegradedResponse("Hello there!"), false));
  await t.test('detects invalid json when structured', () => assert.strictEqual(isDegradedResponse("Hello", true), true));
  await t.test('passes valid json when structured', () => assert.strictEqual(isDegradedResponse('{"a":1}', true), false));
  await t.test('detects repeated loops', () => assert.strictEqual(isDegradedResponse("abcdeabcdeabcdeabcdeabcdeabcdeabcdeabcdeabcdeabcdeabcdeabcdeabcdeabcdeabcdeabcdeabcdeabcdeabcdeabcde"), true));
});
