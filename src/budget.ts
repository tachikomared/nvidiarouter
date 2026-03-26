export interface BudgetConfig {
  maxCostPerRunUsd?: number;
  maxInputTokensPerRun?: number;
  maxOutputTokensPerRun?: number;
  budgetMode?: 'graceful' | 'strict';
}

export interface BudgetState {
  spentUsd: number;
  inputTokens: number;
  outputTokens: number;
  downgradeHappened: boolean;
}

export function checkBudget(config: BudgetConfig | undefined, state: BudgetState): 'ok' | 'downgrade' | 'reject' {
  if (!config) return 'ok';

  if (config.maxCostPerRunUsd && state.spentUsd > config.maxCostPerRunUsd) {
    return config.budgetMode === 'strict' ? 'reject' : 'downgrade';
  }

  if (config.maxInputTokensPerRun && state.inputTokens > config.maxInputTokensPerRun) {
    return config.budgetMode === 'strict' ? 'reject' : 'downgrade';
  }

  if (config.maxOutputTokensPerRun && state.outputTokens > config.maxOutputTokensPerRun) {
    return config.budgetMode === 'strict' ? 'reject' : 'downgrade';
  }

  return 'ok';
}
