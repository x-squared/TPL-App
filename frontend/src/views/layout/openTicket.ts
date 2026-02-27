import { api } from '../../api';
import { getRecentErrorLog, type ClientErrorLogEntry } from '../../api/errorLog';

const wrapBase64 = (value: string): string => value.replace(/(.{1,76})/g, '$1\r\n').trimEnd();

const utf8ToBase64 = (value: string): string => {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
};

const prettyLogEntry = (entry: ClientErrorLogEntry, index: number): string => {
  const lines: string[] = [];
  lines.push(`[${index + 1}] ${entry.ts} (${entry.source.toUpperCase()})`);
  lines.push(`message: ${entry.message}`);
  if (typeof entry.status === 'number') lines.push(`status: ${entry.status}`);
  if (entry.method) lines.push(`method: ${entry.method}`);
  if (entry.path) lines.push(`path: ${entry.path}`);
  if (entry.detail !== undefined) lines.push(`detail: ${JSON.stringify(entry.detail, null, 2)}`);
  return lines.join('\n');
};

const buildAttachmentText = (bannerMessage: string): string => {
  const recent = getRecentErrorLog(40);
  const header = [
    'TPL App - Error Ticket Log',
    `Generated at: ${new Date().toISOString()}`,
    `Visible error: ${bannerMessage}`,
    '',
    'Recent client error log:',
    '',
  ].join('\n');
  if (recent.length === 0) {
    return `${header}(no log entries available)\n`;
  }
  return `${header}${recent.map(prettyLogEntry).join('\n\n')}\n`;
};

const buildFriendlyBody = (bannerMessage: string): string => [
  'Hello support team,',
  '',
  'I ran into an issue in TPL App and would appreciate your help.',
  '',
  `Current error message: ${bannerMessage}`,
  '',
  'I attached a log file with recent technical details from the client error log.',
  'Please let me know if you need any additional context (steps, timestamp, user workflow).',
  '',
  'Thank you very much!',
].join('\r\n');

const buildSubject = (bannerMessage: string): string => {
  const normalized = bannerMessage.trim().replace(/\s+/g, ' ');
  const shortened = normalized.length > 80 ? `${normalized.slice(0, 77)}...` : normalized;
  return `TPL App issue report: ${shortened || 'Unexpected error'}`;
};

const downloadFile = (filename: string, content: string, mimeType: string): void => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
};

let cachedSupportEmail: string | null = null;

async function getSupportEmail(): Promise<string> {
  if (cachedSupportEmail) return cachedSupportEmail;
  const config = await api.getSupportTicketConfig();
  cachedSupportEmail = config.support_email;
  return cachedSupportEmail;
}

export async function openTicketDraft(bannerMessage: string): Promise<void> {
  const supportEmail = await getSupportEmail();
  const subject = buildSubject(bannerMessage);
  const body = buildFriendlyBody(bannerMessage);
  const attachmentText = buildAttachmentText(bannerMessage);
  const attachmentBase64 = wrapBase64(utf8ToBase64(attachmentText));
  const boundary = `tpl-ticket-${Date.now()}`;
  const eml = [
    `To: ${supportEmail}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: 8bit',
    '',
    body,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"; name="tpl-error-log.txt"',
    'Content-Disposition: attachment; filename="tpl-error-log.txt"',
    'Content-Transfer-Encoding: base64',
    '',
    attachmentBase64,
    '',
    `--${boundary}--`,
    '',
  ].join('\r\n');
  downloadFile('tpl-open-ticket.eml', eml, 'message/rfc822');
}
