import { test } from 'node:test';
import * as assert from 'node:assert';
import { checkBudget } from './budget.js';

test('budget checks', async (t) => {
  await t.test('strict reject', () => {
    assert.strictEqual(checkBudget({ budgetMode: 'strict', maxCostPerRunUsd: 1 }, { spentUsd: 2, inputTokens: 0, outputTokens: 0, downgradeHappened: false }), 'reject');
  });
  await t.test('graceful downgrade', () => {
    assert.strictEqual(checkBudget({ budgetMode: 'graceful', maxCostPerRunUsd: 1 }, { spentUsd: 2, inputTokens: 0, outputTokens: 0, downgradeHappened: false }), 'downgrade');
  });
  await t.test('passes within budget', () => {
    assert.strictEqual(checkBudget({ budgetMode: 'strict', maxCostPerRunUsd: 10 }, { spentUsd: 2, inputTokens: 0, outputTokens: 0, downgradeHappened: false }), 'ok');
  });
});
