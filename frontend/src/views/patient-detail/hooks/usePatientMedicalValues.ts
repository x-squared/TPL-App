import { createElement, useEffect, useState } from 'react';
import { api, type Code, type MedicalValueCreate, type MedicalValueTemplate, type MedicalValueUpdate, type Patient } from '../../../api';
import { formatValue, getCatalogueType, getConfig, isCatalogueDatatype, validateValue } from '../../../utils/datatypeFramework';

export function usePatientMedicalValues(
  patientId: number,
  patient: Patient | null,
  refreshPatient: () => Promise<void>,
  organCodes: Code[],
) {
  const [mvTemplates, setMvTemplates] = useState<MedicalValueTemplate[]>([]);
  const [datatypeCodes, setDatatypeCodes] = useState<Code[]>([]);
  const [addingMv, setAddingMv] = useState(false);
  const [mvAddMode, setMvAddMode] = useState<'template' | 'custom'>('template');
  const [mvSaving, setMvSaving] = useState(false);
  const [mvForm, setMvForm] = useState<MedicalValueCreate>({
    medical_value_template_id: null,
    name: '',
    value: '',
    renew_date: '',
  });
  const [confirmDeleteMvId, setConfirmDeleteMvId] = useState<number | null>(null);
  const [editingMvId, setEditingMvId] = useState<number | null>(null);
  const [mvEditForm, setMvEditForm] = useState<MedicalValueUpdate>({});
  const [catalogueCache, setCatalogueCache] = useState<Record<string, Code[]>>({});
  const [mvSortKey, setMvSortKey] = useState<'pos' | 'name' | 'renew_date'>('pos');
  const [mvSortAsc, setMvSortAsc] = useState(true);
  const [mvDragId, setMvDragId] = useState<number | null>(null);
  const [mvDragOverId, setMvDragOverId] = useState<number | null>(null);

  useEffect(() => {
    api.listMedicalValueTemplates().then((templates) => {
      setMvTemplates(templates);
      if (templates.length > 0) {
        setMvForm((f) => ({
          ...f,
          medical_value_template_id: templates[0].id,
          name: templates[0].name_default,
        }));
      }
    });
    api.listCodes('DATATYPE').then((codes) => {
      setDatatypeCodes(codes);
      codes.filter(isCatalogueDatatype).forEach((dt) => {
        const catType = getCatalogueType(dt);
        if (catType) {
          api.listCatalogues(catType).then((entries) =>
            setCatalogueCache((prev) => ({ ...prev, [catType]: entries }))
          );
        }
      });
    });
  }, [patientId]);

  const resetMvForm = () => {
    if (mvAddMode === 'template') {
      const first = mvTemplates[0];
      setMvForm({ medical_value_template_id: first?.id ?? null, name: first?.name_default ?? '', value: '', renew_date: '' });
    } else {
      setMvForm({ medical_value_template_id: null, datatype_id: datatypeCodes[0]?.id ?? null, name: '', value: '', renew_date: '' });
    }
  };

  const handleAddAllMv = async () => {
    if (!patient || mvTemplates.length === 0) return;
    const organFlagByKey: Record<
      string,
      'use_kidney' | 'use_liver' | 'use_heart' | 'use_lung' | 'use_donor'
    > = {
      KIDNEY: 'use_kidney',
      LIVER: 'use_liver',
      HEART: 'use_heart',
      LUNG: 'use_lung',
      DONOR: 'use_donor',
    };
    const templateMatchesOrgan = (tpl: MedicalValueTemplate, organKey: string) => {
      const flag = organFlagByKey[organKey];
      if (!flag) return false;
      return Boolean(tpl[flag]);
    };
    const existingTplIds = new Set(patient.medical_values?.map((mv) => mv.medical_value_template_id).filter(Boolean));
    const openOrganKeys = new Set(
      (patient.episodes ?? [])
        .filter((ep) => !ep.closed)
        .map((ep) => ep.organ?.key ?? organCodes.find((c) => c.id === ep.organ_id)?.key ?? '')
        .filter((key) => key !== '')
    );
    const eligible = mvTemplates.filter((tpl) => {
      for (const organKey of openOrganKeys) {
        if (templateMatchesOrgan(tpl, organKey)) return true;
      }
      return false;
    });
    const missing = eligible.filter((tpl) => !existingTplIds.has(tpl.id));
    if (missing.length === 0) return;
    setMvSaving(true);
    try {
      for (const tpl of missing) {
        await api.createMedicalValue(patient.id, {
          medical_value_template_id: tpl.id,
          datatype_id: tpl.datatype_id,
          name: tpl.name_default,
          pos: tpl.pos,
          value: '',
          renew_date: null,
        });
      }
      await refreshPatient();
    } finally {
      setMvSaving(false);
    }
  };

  const handleAddMv = async () => {
    if (!patient) return;
    if (mvAddMode === 'template' && !mvForm.medical_value_template_id) return;
    if (mvAddMode === 'custom' && (!mvForm.datatype_id || !mvForm.name?.trim())) return;
    setMvSaving(true);
    try {
      if (mvAddMode === 'template') {
        const tpl = mvTemplates.find((t) => t.id === mvForm.medical_value_template_id);
        await api.createMedicalValue(patient.id, {
          medical_value_template_id: mvForm.medical_value_template_id,
          datatype_id: tpl?.datatype_id ?? null,
          name: tpl?.name_default ?? '',
          pos: tpl?.pos ?? 0,
          value: mvForm.value,
          renew_date: mvForm.renew_date || null,
        });
      } else {
        await api.createMedicalValue(patient.id, {
          medical_value_template_id: null,
          datatype_id: mvForm.datatype_id,
          name: mvForm.name,
          value: mvForm.value,
          renew_date: mvForm.renew_date || null,
        });
      }
      await refreshPatient();
      resetMvForm();
      setAddingMv(false);
    } finally {
      setMvSaving(false);
    }
  };

  const handleDeleteMv = async (id: number) => {
    if (!patient) return;
    await api.deleteMedicalValue(patient.id, id);
    setConfirmDeleteMvId(null);
    await refreshPatient();
  };

  const startEditingMv = (mv: { id: number; medical_value_template_id: number; name: string; value: string; renew_date: string | null }) => {
    setEditingMvId(mv.id);
    setMvEditForm({ medical_value_template_id: mv.medical_value_template_id, name: mv.name, value: mv.value, renew_date: mv.renew_date });
    setConfirmDeleteMvId(null);
  };

  const cancelEditingMv = () => {
    setEditingMvId(null);
  };

  const handleSaveMv = async () => {
    if (!patient || editingMvId === null) return;
    setMvSaving(true);
    try {
      const tpl = mvTemplates.find((t) => t.id === mvEditForm.medical_value_template_id);
      await api.updateMedicalValue(patient.id, editingMvId, {
        ...mvEditForm,
        datatype_id: tpl?.datatype_id ?? undefined,
      });
      setEditingMvId(null);
      await refreshPatient();
    } finally {
      setMvSaving(false);
    }
  };

  const resolveDt = (templateId?: number | null, datatypeId?: number | null): Code | null => {
    if (templateId) {
      const tpl = mvTemplates.find((t) => t.id === templateId);
      if (tpl?.datatype) return tpl.datatype;
      if (tpl) return datatypeCodes.find((c) => c.id === tpl.datatype_id) ?? null;
    }
    if (datatypeId) return datatypeCodes.find((c) => c.id === datatypeId) ?? null;
    return null;
  };

  const renderValueInput = (
    value: string,
    dt: Code | null,
    onChange: (v: string) => void,
    className: string,
  ) => {
    const cfg = getConfig(dt);

    if (cfg.inputType === 'catalogue') {
      const catType = getCatalogueType(dt);
      const entries = catalogueCache[catType] ?? [];
      return createElement(
        'select',
        { className, value, onChange: (e: Event) => onChange((e.target as HTMLSelectElement).value) },
        createElement('option', { value: '' }, '-'),
        ...entries.map((c) => createElement('option', { key: c.id, value: c.key }, c.name_default)),
      );
    }
    if (cfg.inputType === 'boolean') {
      return createElement(
        'select',
        { className, value, onChange: (e: Event) => onChange((e.target as HTMLSelectElement).value) },
        createElement('option', { value: '' }, '-'),
        createElement('option', { value: 'true' }, 'Yes'),
        createElement('option', { value: 'false' }, 'No'),
      );
    }
    return createElement('input', {
      className,
      type: cfg.inputType === 'number' ? 'number' : cfg.inputType === 'date' ? 'date' : 'text',
      step: cfg.step,
      placeholder: cfg.placeholder,
      value,
      onChange: (e: Event) => onChange((e.target as HTMLInputElement).value),
    });
  };

  const toggleMvSort = (key: 'pos' | 'name' | 'renew_date') => {
    if (mvSortKey === key) {
      setMvSortAsc((prev) => !prev);
    } else {
      setMvSortKey(key);
      setMvSortAsc(true);
    }
  };

  const mvSortIndicator = (key: 'pos' | 'name' | 'renew_date') =>
    mvSortKey === key ? (mvSortAsc ? ' ▲' : ' ▼') : '';

  const sortedMedicalValues = patient?.medical_values
    ? [...patient.medical_values].sort((a, b) => {
      let cmp = 0;
      if (mvSortKey === 'pos') {
        cmp = (a.pos ?? 0) - (b.pos ?? 0);
      } else if (mvSortKey === 'name') {
        cmp = (a.name || '').localeCompare(b.name || '');
      } else if (mvSortKey === 'renew_date') {
        const aHas = a.renew_date ? 0 : 1;
        const bHas = b.renew_date ? 0 : 1;
        if (aHas !== bHas) {
          cmp = aHas - bHas;
          return mvSortAsc ? cmp : -cmp;
        }
        cmp = (a.renew_date ?? '').localeCompare(b.renew_date ?? '');
      }
      return mvSortAsc ? cmp : -cmp;
    })
    : [];

  const handleMvDrop = async (targetId: number) => {
    if (!patient || mvDragId === null || mvDragId === targetId) {
      setMvDragId(null);
      setMvDragOverId(null);
      return;
    }
    const ordered = [...sortedMedicalValues];
    const fromIdx = ordered.findIndex((mv) => mv.id === mvDragId);
    const toIdx = ordered.findIndex((mv) => mv.id === targetId);
    if (fromIdx === -1 || toIdx === -1) {
      setMvDragId(null);
      setMvDragOverId(null);
      return;
    }
    const [moved] = ordered.splice(fromIdx, 1);
    ordered.splice(toIdx, 0, moved);
    setMvDragId(null);
    setMvDragOverId(null);
    setMvSaving(true);
    try {
      for (let i = 0; i < ordered.length; i++) {
        const newPos = i + 1;
        if (ordered[i].pos !== newPos) {
          await api.updateMedicalValue(patient.id, ordered[i].id, { pos: newPos });
        }
      }
      await refreshPatient();
      setMvSortKey('pos');
      setMvSortAsc(true);
    } finally {
      setMvSaving(false);
    }
  };

  return {
    mvTemplates,
    datatypeCodes,
    addingMv,
    setAddingMv,
    mvAddMode,
    setMvAddMode,
    mvSaving,
    mvForm,
    setMvForm,
    confirmDeleteMvId,
    setConfirmDeleteMvId,
    editingMvId,
    mvEditForm,
    setMvEditForm,
    catalogueCache,
    mvSortKey,
    mvSortAsc,
    mvDragId,
    mvDragOverId,
    setMvDragId,
    setMvDragOverId,
    sortedMedicalValues,
    handleAddAllMv,
    handleAddMv,
    handleDeleteMv,
    startEditingMv,
    cancelEditingMv,
    handleSaveMv,
    resolveDt,
    renderValueInput,
    toggleMvSort,
    mvSortIndicator,
    handleMvDrop,
    validateValue,
    formatValue,
    getCatalogueType,
  };
}
