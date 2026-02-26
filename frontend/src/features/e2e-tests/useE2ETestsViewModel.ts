import { useCallback, useEffect, useState } from 'react';
import {
  api,
  type E2ETestRunResponse,
  type E2ETestRunnerKey,
  type E2ETestRunnerOption,
} from '../../api';

export function useE2ETestsViewModel() {
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');
  const [runners, setRunners] = useState<E2ETestRunnerOption[]>([]);
  const [selectedRunner, setSelectedRunner] = useState<E2ETestRunnerKey>('partner');
  const [outputTailLines, setOutputTailLines] = useState(160);
  const [lastResult, setLastResult] = useState<E2ETestRunResponse | null>(null);

  const loadMetadata = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.getE2ETestMetadata();
      setRunners(response.runners);
      if (response.runners.length > 0) {
        setSelectedRunner(response.runners[0].key);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load E2E test metadata');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMetadata();
  }, [loadMetadata]);

  const runTests = useCallback(async () => {
    setRunning(true);
    setError('');
    try {
      const result = await api.runE2ETest({
        runner: selectedRunner,
        output_tail_lines: outputTailLines,
      });
      setLastResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run E2E tests');
    } finally {
      setRunning(false);
    }
  }, [outputTailLines, selectedRunner]);

  const clearResults = useCallback(() => {
    setLastResult(null);
  }, []);

  return {
    loading,
    running,
    error,
    runners,
    selectedRunner,
    setSelectedRunner,
    outputTailLines,
    setOutputTailLines,
    lastResult,
    runTests,
    clearResults,
    refreshMetadata: loadMetadata,
  };
}
