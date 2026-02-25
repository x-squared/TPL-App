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
