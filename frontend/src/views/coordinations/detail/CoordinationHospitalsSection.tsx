import type React from 'react';
import type { Code, CoordinationOrigin } from '../../../api';
import EditableSectionHeader from '../../layout/EditableSectionHeader';
import ErrorBanner from '../../layout/ErrorBanner';

interface OriginDraft {
  detection_hospital_id: number;
  procurement_hospital_id: number;
}

interface Props {
  origin: CoordinationOrigin | null;
  originDraft: OriginDraft;
  setOriginDraft: React.Dispatch<React.SetStateAction<OriginDraft>>;
  originEditing: boolean;
  originSaving: boolean;
  originDirty: boolean;
  originError: string;
  hospitals: Code[];
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
}

export default function CoordinationHospitalsSection({
  origin,
  originDraft,
  setOriginDraft,
  originEditing,
  originSaving,
  originDirty,
  originError,
  hospitals,
  onEdit,
  onSave,
  onCancel,
}: Props) {
  return (
    <section className="detail-section ui-panel-section">
      <EditableSectionHeader
        title="Hospitals"
        editing={originEditing}
        saving={originSaving}
        dirty={originDirty}
        onEdit={onEdit}
        onSave={onSave}
        onCancel={onCancel}
      />
      <div className="detail-grid">
        <div className="detail-field">
          <span className="detail-label">Detection hospital</span>
          {originEditing ? (
            <select
              className="detail-input"
              value={originDraft.detection_hospital_id || ''}
              onChange={(e) =>
                setOriginDraft((prev) => ({
                  ...prev,
                  detection_hospital_id: e.target.value ? Number(e.target.value) : 0,
                }))
              }
            >
              <option value="">–</option>
              {hospitals.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name_default}
                </option>
              ))}
            </select>
          ) : (
            <span className="detail-value">{origin?.detection_hospital?.name_default ?? '–'}</span>
          )}
        </div>
        <div className="detail-field">
          <span className="detail-label">Procurement hospital</span>
          {originEditing ? (
            <select
              className="detail-input"
              value={originDraft.procurement_hospital_id || ''}
              onChange={(e) =>
                setOriginDraft((prev) => ({
                  ...prev,
                  procurement_hospital_id: e.target.value ? Number(e.target.value) : 0,
                }))
              }
            >
              <option value="">–</option>
              {hospitals.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name_default}
                </option>
              ))}
            </select>
          ) : (
            <span className="detail-value">{origin?.procurement_hospital?.name_default ?? '–'}</span>
          )}
        </div>
      </div>
      <ErrorBanner message={originError} />
    </section>
  );
}
