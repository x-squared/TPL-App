import { useMemo } from 'react';

import type { ProcurementAdminConfig } from '../../../api';
import ErrorBanner from '../../layout/ErrorBanner';
import ConfiguredFieldsSection from './procurementConfig/ConfiguredFieldsSection';
import ConfiguredGroupsSection from './procurementConfig/ConfiguredGroupsSection';
import type {
  ProcurementFieldCreatePayload,
  ProcurementFieldUpdatePayload,
  ProcurementGroupCreatePayload,
  ProcurementGroupUpdatePayload,
  ProcurementScopeCreatePayload,
} from './procurementConfig/types';

interface AdminProcurementConfigTabProps {
  config: ProcurementAdminConfig | null;
  loading: boolean;
  saving: boolean;
  error: string;
  status: string;
  scopesByFieldId: Record<number, ProcurementAdminConfig['field_scope_templates']>;
  onCreateGroup: (payload: ProcurementGroupCreatePayload) => Promise<void>;
  onUpdateGroup: (groupId: number, payload: ProcurementGroupUpdatePayload) => Promise<void>;
  onReorderGroups: (groupIdsInOrder: number[]) => Promise<void>;
  onDeleteGroup: (groupId: number) => Promise<void>;
  onCreateField: (payload: ProcurementFieldCreatePayload) => Promise<void>;
  onUpdateField: (fieldId: number, payload: ProcurementFieldUpdatePayload) => Promise<void>;
  onReorderFields: (
    assignments: Array<{ field_id: number; group_template_id: number | null; pos: number }>,
  ) => Promise<void>;
  onCreateScope: (payload: ProcurementScopeCreatePayload) => Promise<void>;
  onDeleteScope: (scopeId: number) => Promise<void>;
}

export default function AdminProcurementConfigTab({
  config,
  loading,
  saving,
  error,
  status,
  scopesByFieldId,
  onCreateGroup,
  onUpdateGroup,
  onReorderGroups,
  onDeleteGroup,
  onCreateField,
  onUpdateField,
  onReorderFields,
  onCreateScope,
  onDeleteScope,
}: AdminProcurementConfigTabProps) {
  const sortedDatatypes = useMemo(
    () => [...(config?.datatype_definitions ?? [])].sort((a, b) => (a.code?.name_default ?? '').localeCompare(b.code?.name_default ?? '')),
    [config?.datatype_definitions],
  );
  const groupNameById = useMemo(
    () =>
      new Map(
        (config?.field_group_templates ?? []).map((group) => [group.id, group.name_default] as const),
      ),
    [config?.field_group_templates],
  );
  const datatypeNameById = useMemo(
    () =>
      new Map(
        (config?.datatype_definitions ?? []).map((datatype) => [
          datatype.id,
          datatype.code?.name_default ?? datatype.code?.key ?? `Datatype ${datatype.id}`,
        ] as const),
      ),
    [config?.datatype_definitions],
  );

  const resolvedGroups = useMemo(() => {
    const explicit = config?.field_group_templates ?? [];
    if (explicit.length > 0) {
      return explicit;
    }
    const fromFields = new Map<number, NonNullable<ProcurementAdminConfig['field_group_templates'][number]>>();
    for (const field of config?.field_templates ?? []) {
      if (field.group_template) {
        fromFields.set(field.group_template.id, field.group_template);
      }
    }
    return [...fromFields.values()].sort((a, b) => a.pos - b.pos || a.id - b.id);
  }, [config?.field_group_templates, config?.field_templates]);
  const sortedFieldTemplates = useMemo(() => {
    const groupPosById = new Map(resolvedGroups.map((group) => [group.id, group.pos] as const));
    return [...(config?.field_templates ?? [])].sort((a, b) => {
      const ga = a.group_template_id != null ? (groupPosById.get(a.group_template_id) ?? 9999) : 9999;
      const gb = b.group_template_id != null ? (groupPosById.get(b.group_template_id) ?? 9999) : 9999;
      return ga - gb || a.pos - b.pos || a.id - b.id;
    });
  }, [config?.field_templates, resolvedGroups]);

  return (
    <section className="detail-section ui-panel-section">
      {loading && <p className="status">Loading procurement configuration...</p>}
      {error && <ErrorBanner message={error} />}
      {status && <p className="status">{status}</p>}
      {!loading && config && (
        <>
          <ConfiguredGroupsSection
            groups={resolvedGroups}
            saving={saving}
            onCreateGroup={onCreateGroup}
            onUpdateGroup={onUpdateGroup}
            onReorderGroups={onReorderGroups}
            onDeleteGroup={onDeleteGroup}
          />

          <ConfiguredFieldsSection
            config={config}
            groups={resolvedGroups}
            sortedDatatypes={sortedDatatypes}
            sortedFieldTemplates={sortedFieldTemplates}
            groupNameById={groupNameById}
            datatypeNameById={datatypeNameById}
            scopesByFieldId={scopesByFieldId}
            saving={saving}
            onCreateField={onCreateField}
            onUpdateField={onUpdateField}
            onReorderFields={onReorderFields}
            onCreateScope={onCreateScope}
            onDeleteScope={onDeleteScope}
          />
        </>
      )}
    </section>
  );
}
