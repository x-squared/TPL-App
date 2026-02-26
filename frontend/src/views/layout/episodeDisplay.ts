import { formatDateDdMmYyyy } from './dateFormat';

interface PatientFavoriteParts {
  fullName: string | null | undefined;
  birthDate: string | null | undefined;
  pid: string | null | undefined;
}

interface EpisodeDisplayParts {
  patientName: string | null | undefined;
  organName: string | null | undefined;
  startDate: string | null | undefined;
}

const clean = (value: string | null | undefined, fallback: string): string => {
  const text = value?.trim();
  return text ? text : fallback;
};

export function formatPatientFavoriteName(parts: PatientFavoriteParts): string {
  const fullName = clean(parts.fullName, 'Unknown patient');
  const birthDate = formatDateDdMmYyyy(parts.birthDate);
  const pid = clean(parts.pid, '–');
  return `${fullName} (${birthDate}), ${pid}`;
}

export function formatEpisodeDisplayName(parts: EpisodeDisplayParts): string {
  const patient = clean(parts.patientName, 'Unknown patient');
  const organ = clean(parts.organName, 'Unknown organ');
  const start = formatDateDdMmYyyy(parts.startDate);
  return `${patient}, ${organ}, ${start}`;
}

export function formatOrganNames(
  organs: Array<{ name_default?: string | null }> | null | undefined,
  fallbackOrganName?: string | null,
): string {
  const names = (organs ?? [])
    .map((organ) => organ.name_default?.trim() ?? '')
    .filter((name) => name.length > 0);
  const unique = [...new Set(names)];
  if (unique.length > 0) return unique.join(' + ');
  return clean(fallbackOrganName, 'Unknown organ');
}

interface EpisodeFavoriteParts {
  fullName: string | null | undefined;
  birthDate: string | null | undefined;
  pid: string | null | undefined;
  organName: string | null | undefined;
  startDate: string | null | undefined;
}

export function formatEpisodeFavoriteName(parts: EpisodeFavoriteParts): string {
  const patientPart = formatPatientFavoriteName({
    fullName: parts.fullName,
    birthDate: parts.birthDate,
    pid: parts.pid,
  });
  return formatEpisodeDisplayName({
    patientName: patientPart,
    organName: parts.organName,
    startDate: parts.startDate,
  });
}

interface TaskPatientReferenceParts {
  patientId: number;
  fullName: string | null | undefined;
  birthDate: string | null | undefined;
  pid: string | null | undefined;
}

interface TaskEpisodeReferenceParts {
  episodeId: number;
  fullName: string | null | undefined;
  birthDate: string | null | undefined;
  pid: string | null | undefined;
  organName: string | null | undefined;
  startDate: string | null | undefined;
}

export function formatTaskPatientReference(parts: TaskPatientReferenceParts): string {
  const hasCorePatientData = Boolean(parts.fullName?.trim() || parts.pid?.trim());
  if (!hasCorePatientData) return `Patient #${parts.patientId}`;
  return formatPatientFavoriteName({
    fullName: parts.fullName,
    birthDate: parts.birthDate,
    pid: parts.pid,
  });
}

export function formatTaskEpisodeReference(parts: TaskEpisodeReferenceParts): string {
  const hasEpisodeContext = Boolean(parts.organName?.trim() || parts.startDate);
  if (!hasEpisodeContext) return `Episode #${parts.episodeId}`;
  return formatEpisodeFavoriteName({
    fullName: parts.fullName,
    birthDate: parts.birthDate,
    pid: parts.pid,
    organName: parts.organName,
    startDate: parts.startDate,
  });
}
