import { useCallback, useState } from "react";

function resolveUpdate(update, value) {
  return typeof update === "function" ? update(value) : update;
}

export function useScenarioHistory(initialScenario, limit = 50) {
  const [history, setHistory] = useState({ past: [], present: initialScenario, future: [] });

  const updateScenario = useCallback((update) => {
    setHistory((current) => {
      const next = resolveUpdate(update, current.present);
      if (next === current.present) return current;
      return { past: [...current.past, current.present].slice(-limit), present: next, future: [] };
    });
  }, [limit]);

  const updateRepositories = useCallback((update) => {
    updateScenario((current) => ({ ...current, repositories: resolveUpdate(update, current.repositories) }));
  }, [updateScenario]);

  const updateTargets = useCallback((update) => {
    updateScenario((current) => ({ ...current, targets: resolveUpdate(update, current.targets) }));
  }, [updateScenario]);

  const undo = useCallback(() => {
    setHistory((current) => current.past.length ? {
      past: current.past.slice(0, -1),
      present: current.past.at(-1),
      future: [current.present, ...current.future]
    } : current);
  }, []);

  const redo = useCallback(() => {
    setHistory((current) => current.future.length ? {
      past: [...current.past, current.present].slice(-limit),
      present: current.future[0],
      future: current.future.slice(1)
    } : current);
  }, [limit]);

  const replaceScenario = useCallback((scenario, { record = true } = {}) => {
    if (record) updateScenario(scenario);
    else setHistory({ past: [], present: scenario, future: [] });
  }, [updateScenario]);

  return {
    scenario: history.present,
    updateScenario,
    updateRepositories,
    updateTargets,
    replaceScenario,
    undo,
    redo,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0
  };
}
