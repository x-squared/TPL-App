import { useEffect, useRef } from 'react';
import type { CoordinationListRow } from './useCoordinationsListViewModel';
import ErrorBanner from '../../layout/ErrorBanner';
import { formatDateDdMmYyyy } from '../../layout/dateFormat';
import type { Code } from '../../../api';
import { useI18n } from '../../../i18n/i18n';

function fmt(value: string | null | undefined): string {
  return formatDateDdMmYyyy(value);
}

interface Props {
  rows: CoordinationListRow[];
  onOpenCoordination: (id: number) => void;
  adding: boolean;
  creating: boolean;
  createError: string;
  deathKindCodes: Code[];
  startDateInput: string;
  donorFullName: string;
  donorBirthDateInput: string;
  donorDeathKindId: number | null;
  donorNr: string;
  swtplNr: string;
  nationalCoordinator: string;
  comment: string;
  donorFocusToken: number;
  onDateChange: (value: string) => void;
  onDonorFullNameChange: (value: string) => void;
  onDonorBirthDateChange: (value: string) => void;
  onDonorDeathKindChange: (value: string) => void;
  onFieldChange: (key: 'donor_nr' | 'swtpl_nr' | 'national_coordinator' | 'comment', value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

export default function CoordinationsTable({
  rows,
  onOpenCoordination,
  adding,
  creating,
  createError,
  deathKindCodes,
  startDateInput,
  donorFullName,
  donorBirthDateInput,
  donorDeathKindId,
  donorNr,
  swtplNr,
  nationalCoordinator,
  comment,
  donorFocusToken,
  onDateChange,
  onDonorFullNameChange,
  onDonorBirthDateChange,
  onDonorDeathKindChange,
  onFieldChange,
  onSave,
  onCancel,
}: Props) {
  const { t } = useI18n();
  const donorNameInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!adding) {
      return;
    }
    donorNameInputRef.current?.focus();
  }, [adding, donorFocusToken]);

  return (
    <div className="patients-table-wrap ui-table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th className="open-col"></th>
            <th>{t('coordinations.table.status', 'Status')}</th>
            <th>{t('coordinations.table.start', 'Start')}</th>
            <th>{t('coordinations.table.end', 'End')}</th>
            <th>{t('coordinations.table.donorName', 'Donor Name')}</th>
            <th>{t('coordinations.table.dateOfBirth', 'Date of Birth')}</th>
            <th>{t('coordinations.table.reasonOfDeath', 'Reason of Death')}</th>
            <th>{t('coordinations.table.swtplNr', 'SWTPL Nr')}</th>
          </tr>
        </thead>
        <tbody>
          {adding && (
            <tr>
              <td colSpan={8}>
                <form
                  className="patients-add-form"
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (!creating) {
                      onSave();
                    }
                  }}
                >
                  <input
                    type="date"
                    value={startDateInput}
                    onChange={(e) => onDateChange(e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder={t('coordinations.form.donorNameRequired', 'Donor name *')}
                    value={donorFullName}
                    ref={donorNameInputRef}
                    onChange={(e) => onDonorFullNameChange(e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder={t('coordinations.form.donorNr', 'Donor Nr')}
                    value={donorNr}
                    onChange={(e) => onFieldChange('donor_nr', e.target.value)}
                  />
                  <input
                    type="date"
                    value={donorBirthDateInput}
                    onChange={(e) => onDonorBirthDateChange(e.target.value)}
                  />
                  <select
                    className="filter-select"
                    value={donorDeathKindId ?? ''}
                    onChange={(e) => onDonorDeathKindChange(e.target.value)}
                  >
                    <option value="">{t('coordinations.form.reasonOfDeath', 'Reason of death...')}</option>
                    {deathKindCodes.map((code) => (
                      <option key={code.id} value={code.id}>
                        {code.name_default}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder={t('coordinations.form.swtplNr', 'SWTPL Nr')}
                    value={swtplNr}
                    onChange={(e) => onFieldChange('swtpl_nr', e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder={t('coordinations.form.nationalCoordinator', 'National coordinator')}
                    value={nationalCoordinator}
                    onChange={(e) => onFieldChange('national_coordinator', e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder={t('coordinations.form.comment', 'Comment')}
                    value={comment}
                    onChange={(e) => onFieldChange('comment', e.target.value)}
                  />
                  <div className="patients-add-actions">
                    <button className="patients-save-btn" type="submit" disabled={creating}>
                      {creating ? t('coordinations.form.saving', 'Saving...') : t('actions.save', 'Save')}
                    </button>
                    <button className="patients-cancel-btn" type="button" onClick={onCancel} disabled={creating}>
                      {t('actions.cancel', 'Cancel')}
                    </button>
                  </div>
                  <ErrorBanner message={createError} />
                </form>
              </td>
            </tr>
          )}
          {rows.length === 0 ? (
            <tr>
              <td colSpan={8} className="status">
                {t('coordinations.empty', 'No coordinations found.')}
              </td>
            </tr>
          ) : rows.map((row) => (
            <tr key={row.coordination.id} onDoubleClick={() => onOpenCoordination(row.coordination.id)}>
              <td className="open-col">
                <button
                  className="open-btn"
                  onClick={() => onOpenCoordination(row.coordination.id)}
                  title={t('coordinations.actions.openCoordination', 'Open coordination')}
                >
                  &#x279C;
                </button>
              </td>
              <td>{row.coordination.status?.name_default ?? t('common.emptySymbol', '–')}</td>
              <td>{fmt(row.coordination.start)}</td>
              <td>{fmt(row.coordination.end)}</td>
              <td>{row.donor?.full_name || t('common.emptySymbol', '–')}</td>
              <td>{fmt(row.donor?.birth_date ?? null)}</td>
              <td>{row.donor?.death_kind?.name_default ?? t('common.emptySymbol', '–')}</td>
              <td>{row.coordination.swtpl_nr || t('common.emptySymbol', '–')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
