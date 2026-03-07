import type { SelectedComponentDescriptor } from './types';

export function parseCaptureState(raw: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    // keep empty state for invalid payloads
  }
  return {};
}

export function getCurrentCaptureContext() {
  const path = window.location.pathname;
  const query = window.location.search;
  const hash = window.location.hash;
  const idMatches = Array.from(path.matchAll(/\/(\d+)(?=\/|$)/g)).map((match) => Number(match[1]));
  const guiPart = path.split('/').filter(Boolean)[1] ?? 'app';
  return {
    capture_url: `${path}${query}${hash}`,
    capture_gui_part: guiPart,
    capture_state_json: JSON.stringify({
      path,
      query,
      hash,
      gui_part: guiPart,
      ids: idMatches,
      captured_at: new Date().toISOString(),
    }),
  };
}

export function withSelectedComponent(captureStateJson: string, selected: SelectedComponentDescriptor | null): string {
  let payload: Record<string, unknown> = {};
  try {
    const parsed = JSON.parse(captureStateJson);
    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
      payload = parsed as Record<string, unknown>;
    }
  } catch {
    payload = {};
  }
  payload.selected_component = selected;
  return JSON.stringify(payload);
}
