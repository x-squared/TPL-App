import type React from 'react';
import type { Code, CoordinationDonor } from '../../../api';
import EditableSectionHeader from '../../layout/EditableSectionHeader';
import { formatDateDdMmYyyy } from '../../layout/dateFormat';

interface DonorDraft {
  full_name: string;
  birth_date: string;
  sex_id: number | null;
  blood_type_id: number | null;
  height: number | null;
  weight: number | null;
  organ_fo: string;
  diagnosis_id: number | null;
  death_kind_id: number;
}

interface Props {
  donor: CoordinationDonor | null;
  donorDraft: DonorDraft;
  setDonorDraft: React.Dispatch<React.SetStateAction<DonorDraft>>;
  donorEditing: boolean;
  donorSaving: boolean;
  donorDirty: boolean;
  donorError: string;
  deathKinds: Code[];
  sexCodes: Code[];
  bloodTypes: Code[];
  diagnosisDonorOptions: Code[];
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
}

export default function CoordinationDonorDataSection({
  donor,
  donorDraft,
  setDonorDraft,
  donorEditing,
  donorSaving,
  donorDirty,
  donorError,
  deathKinds,
  sexCodes,
  bloodTypes,
  diagnosisDonorOptions,
  onEdit,
  onSave,
  onCancel,
}: Props) {
  return (
    <section className="detail-section ui-panel-section">
      <EditableSectionHeader
        title="Donor data"
        editing={donorEditing}
        saving={donorSaving}
        dirty={donorDirty}
        onEdit={onEdit}
        onSave={onSave}
        onCancel={onCancel}
      />
      <div className="detail-grid">
        <div className="detail-field">
          <span className="detail-label">Full name</span>
          {donorEditing ? (
            <input
              className="detail-input"
              value={donorDraft.full_name}
              onChange={(e) => setDonorDraft((prev) => ({ ...prev, full_name: e.target.value }))}
            />
          ) : (
            <span className="detail-value">{donor?.full_name || '–'}</span>
          )}
        </div>
        <div className="detail-field">
          <span className="detail-label">Date of birth</span>
          {donorEditing ? (
            <input
              className="detail-input"
              type="date"
              value={donorDraft.birth_date}
              onChange={(e) => setDonorDraft((prev) => ({ ...prev, birth_date: e.target.value }))}
            />
          ) : (
            <span className="detail-value">{formatDateDdMmYyyy(donor?.birth_date)}</span>
          )}
        </div>
        <div className="detail-field">
          <span className="detail-label">Reason of death</span>
          {donorEditing ? (
            <select
              className="detail-input"
              value={donorDraft.death_kind_id || ''}
              onChange={(e) =>
                setDonorDraft((prev) => ({ ...prev, death_kind_id: e.target.value ? Number(e.target.value) : 0 }))
              }
            >
              <option value="">–</option>
              {deathKinds.map((kind) => (
                <option key={kind.id} value={kind.id}>
                  {kind.name_default}
                </option>
              ))}
            </select>
          ) : (
            <span className="detail-value">{donor?.death_kind?.name_default ?? '–'}</span>
          )}
        </div>
        <div className="detail-field">
          <span className="detail-label">Sex</span>
          {donorEditing ? (
            <select
              className="detail-input"
              value={donorDraft.sex_id ?? ''}
              onChange={(e) =>
                setDonorDraft((prev) => ({ ...prev, sex_id: e.target.value ? Number(e.target.value) : null }))
              }
            >
              <option value="">–</option>
              {sexCodes.map((sex) => (
                <option key={sex.id} value={sex.id}>
                  {sex.name_default}
                </option>
              ))}
            </select>
          ) : (
            <span className="detail-value">{sexCodes.find((s) => s.id === donor?.sex_id)?.name_default ?? '–'}</span>
          )}
        </div>
        <div className="detail-field">
          <span className="detail-label">Blood type</span>
          {donorEditing ? (
            <select
              className="detail-input"
              value={donorDraft.blood_type_id ?? ''}
              onChange={(e) =>
                setDonorDraft((prev) => ({ ...prev, blood_type_id: e.target.value ? Number(e.target.value) : null }))
              }
            >
              <option value="">–</option>
              {bloodTypes.map((bt) => (
                <option key={bt.id} value={bt.id}>
                  {bt.name_default}
                </option>
              ))}
            </select>
          ) : (
            <span className="detail-value">{bloodTypes.find((bt) => bt.id === donor?.blood_type_id)?.name_default ?? '–'}</span>
          )}
        </div>
        <div className="detail-field">
          <span className="detail-label">Height (cm)</span>
          {donorEditing ? (
            <input
              className="detail-input"
              type="number"
              value={donorDraft.height ?? ''}
              onChange={(e) =>
                setDonorDraft((prev) => ({ ...prev, height: e.target.value ? Number(e.target.value) : null }))
              }
            />
          ) : (
            <span className="detail-value">{donor?.height ?? '–'}</span>
          )}
        </div>
        <div className="detail-field">
          <span className="detail-label">Weight (kg)</span>
          {donorEditing ? (
            <input
              className="detail-input"
              type="number"
              value={donorDraft.weight ?? ''}
              onChange={(e) =>
                setDonorDraft((prev) => ({ ...prev, weight: e.target.value ? Number(e.target.value) : null }))
              }
            />
          ) : (
            <span className="detail-value">{donor?.weight ?? '–'}</span>
          )}
        </div>
        <div className="detail-field">
          <span className="detail-label">Organ FO</span>
          {donorEditing ? (
            <input
              className="detail-input"
              value={donorDraft.organ_fo}
              onChange={(e) => setDonorDraft((prev) => ({ ...prev, organ_fo: e.target.value }))}
            />
          ) : (
            <span className="detail-value">{donor?.organ_fo || '–'}</span>
          )}
        </div>
        <div className="detail-field">
          <span className="detail-label">Diagnosis</span>
          {donorEditing ? (
            <select
              className="detail-input"
              value={donorDraft.diagnosis_id ?? ''}
              onChange={(e) =>
                setDonorDraft((prev) => ({ ...prev, diagnosis_id: e.target.value ? Number(e.target.value) : null }))
              }
            >
              <option value="">–</option>
              {diagnosisDonorOptions.map((diag) => (
                <option key={diag.id} value={diag.id}>
                  {diag.name_default}
                </option>
              ))}
            </select>
          ) : (
            <span className="detail-value">
              {diagnosisDonorOptions.find((diag) => diag.id === donor?.diagnosis_id)?.name_default ?? '–'}
            </span>
          )}
        </div>
      </div>
      {donorError && <p className="status">{donorError}</p>}
    </section>
  );
}
