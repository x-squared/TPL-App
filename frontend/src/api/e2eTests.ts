import { request } from './core';

export type E2ETestRunnerKey = 'spec' | 'partner';

export interface E2ETestRunnerOption {
  key: E2ETestRunnerKey;
  label: string;
  description: string;
}

export interface E2ETestMetadataResponse {
  runners: E2ETestRunnerOption[];
}

export interface E2ETestRunRequest {
  runner: E2ETestRunnerKey;
  output_tail_lines: number;
}

export interface E2ETestRunResponse {
  runner: E2ETestRunnerKey;
  success: boolean;
  exit_code: number;
  started_at: string;
  finished_at: string;
  duration_seconds: number;
  report_path: string | null;
  output_tail: string;
  report_excerpt: string | null;
}

export const e2eTestsApi = {
  getE2ETestMetadata: () => request<E2ETestMetadataResponse>('/e2e-tests/metadata'),
  runE2ETest: (payload: E2ETestRunRequest) =>
    request<E2ETestRunResponse>('/e2e-tests/run', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};
