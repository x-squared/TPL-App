import { useEffect, useState } from 'react';
import { api, type AbsenceCreate, type AbsenceUpdate, type AppUser, type Code, type ContactInfoCreate, type ContactInfoUpdate, type DiagnosisCreate, type DiagnosisUpdate, type EpisodeCreate, type EpisodeUpdate, type MedicalValueCreate, type MedicalValueTemplate, type MedicalValueUpdate, type Patient, type PatientUpdate } from '../api';
import { formatValue, validateValue, getConfig, isCatalogueDatatype, getCatalogueType } from '../utils/datatypeFramework';
import EpisodesTab from './patient-tabs/EpisodesTab';
import MedicalDataTab from './patient-tabs/MedicalDataTab';
import PatientTab from './patient-tabs/PatientTab';
import './PatientDetailView.css';

function formatDate(iso: string | null): string {
  if (!iso) return '–';
  const date = new Date(iso);
  if (isNaN(date.getTime())) return '–';
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}.${m}.${y}`;
}

interface Props {
  patientId: number;
  onBack: () => void;
}

type Tab = 'patient' | 'medical' | 'episodes';

export default function PatientDetailView({ patientId, onBack }: Props) {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('patient');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [languages, setLanguages] = useState<Code[]>([]);
  const [contactTypes, setContactTypes] = useState<Code[]>([]);
  const [addingContact, setAddingContact] = useState(false);
  const [ciSaving, setCiSaving] = useState(false);
  const [ciForm, setCiForm] = useState<ContactInfoCreate>({ type_id: 0, data: '', comment: '', main: false });
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [editingCiId, setEditingCiId] = useState<number | null>(null);
  const [ciEditForm, setCiEditForm] = useState<ContactInfoUpdate>({});
  const [ciDragId, setCiDragId] = useState<number | null>(null);
  const [ciDragOverId, setCiDragOverId] = useState<number | null>(null);

  const [addingAbsence, setAddingAbsence] = useState(false);
  const [abSaving, setAbSaving] = useState(false);
  const [abForm, setAbForm] = useState<AbsenceCreate>({ start: '', end: '', comment: '' });
  const [confirmDeleteAbId, setConfirmDeleteAbId] = useState<number | null>(null);
  const [editingAbId, setEditingAbId] = useState<number | null>(null);
  const [abEditForm, setAbEditForm] = useState<AbsenceUpdate>({});

  const [diagCodes, setDiagCodes] = useState<Code[]>([]);
  const [addingDiag, setAddingDiag] = useState(false);
  const [diagSaving, setDiagSaving] = useState(false);
  const [diagForm, setDiagForm] = useState<DiagnosisCreate>({ catalogue_id: 0, comment: '' });
  const [confirmDeleteDiagId, setConfirmDeleteDiagId] = useState<number | null>(null);
  const [editingDiagId, setEditingDiagId] = useState<number | null>(null);
  const [diagEditForm, setDiagEditForm] = useState<DiagnosisUpdate>({});

  const [mvTemplates, setMvTemplates] = useState<MedicalValueTemplate[]>([]);
  const [datatypeCodes, setDatatypeCodes] = useState<Code[]>([]);
  const [addingMv, setAddingMv] = useState(false);
  const [mvAddMode, setMvAddMode] = useState<'template' | 'custom'>('template');
  const [mvSaving, setMvSaving] = useState(false);
  const [mvForm, setMvForm] = useState<MedicalValueCreate>({ medical_value_template_id: null, name: '', value: '', renew_date: '' });
  const [confirmDeleteMvId, setConfirmDeleteMvId] = useState<number | null>(null);
  const [editingMvId, setEditingMvId] = useState<number | null>(null);
  const [mvEditForm, setMvEditForm] = useState<MedicalValueUpdate>({});
  const [catalogueCache, setCatalogueCache] = useState<Record<string, Code[]>>({});
  const [mvSortKey, setMvSortKey] = useState<'pos' | 'name' | 'renew_date'>('pos');
  const [mvSortAsc, setMvSortAsc] = useState(true);
  const [mvDragId, setMvDragId] = useState<number | null>(null);
  const [mvDragOverId, setMvDragOverId] = useState<number | null>(null);

  const [organCodes, setOrganCodes] = useState<Code[]>([]);
  const [tplStatusCodes, setTplStatusCodes] = useState<Code[]>([]);
  const [addingEpisode, setAddingEpisode] = useState(false);
  const [epSaving, setEpSaving] = useState(false);
  const [epForm, setEpForm] = useState<EpisodeCreate>({ organ_id: 0 });
  const [confirmDeleteEpId, setConfirmDeleteEpId] = useState<number | null>(null);
  const [editingEpId, setEditingEpId] = useState<number | null>(null);
  const [epEditForm, setEpEditForm] = useState<EpisodeUpdate>({});

  const [bloodTypes, setBloodTypes] = useState<Code[]>([]);
  const [coordUsers, setCoordUsers] = useState<AppUser[]>([]);

  const [form, setForm] = useState({
    pid: '',
    first_name: '',
    name: '',
    date_of_birth: '',
    date_of_death: '',
    ahv_nr: '',
    lang: '',
    blood_type_id: null as number | null,
    resp_coord_id: null as number | null,
    translate: false,
  });

  const refreshPatient = () => api.getPatient(patientId).then(setPatient);

  useEffect(() => {
    api.getPatient(patientId)
      .then(setPatient)
      .finally(() => setLoading(false));
    api.listCatalogues('LANGUAGE').then(setLanguages);
    api.listCodes('CONTACT').then((codes) => {
      setContactTypes(codes);
      if (codes.length > 0) setCiForm((f) => ({ ...f, type_id: codes[0].id }));
    });
    api.listCatalogues('DIAGNOSIS').then((codes) => {
      setDiagCodes(codes);
      if (codes.length > 0) setDiagForm((f) => ({ ...f, catalogue_id: codes[0].id }));
    });
    api.listMedicalValueTemplates().then((templates) => {
      setMvTemplates(templates);
      if (templates.length > 0) setMvForm((f) => ({ ...f, medical_value_template_id: templates[0].id, name: templates[0].name_default }));
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
    api.listCatalogues('BLOOD_TYPE').then(setBloodTypes);
    api.listUsers('KOORD').then(setCoordUsers);
    api.listCodes('ORGAN').then((codes) => {
      setOrganCodes(codes);
      if (codes.length > 0) setEpForm((f) => ({ ...f, organ_id: codes[0].id }));
    });
    api.listCodes('TPL_STATUS').then(setTplStatusCodes);
  }, [patientId]);

  const startEditing = () => {
    if (!patient) return;
    setForm({
      pid: patient.pid ?? '',
      first_name: patient.first_name ?? '',
      name: patient.name ?? '',
      date_of_birth: patient.date_of_birth ?? '',
      date_of_death: patient.date_of_death ?? '',
      ahv_nr: patient.ahv_nr ?? '',
      lang: patient.lang ?? '',
      blood_type_id: patient.blood_type_id ?? null,
      resp_coord_id: patient.resp_coord_id ?? null,
      translate: patient.translate ?? false,
    });
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
  };

  const handleSave = async () => {
    if (!patient) return;
    setSaving(true);
    try {
      const update: PatientUpdate = {
        pid: form.pid,
        first_name: form.first_name,
        name: form.name,
        date_of_birth: form.date_of_birth || null,
        date_of_death: form.date_of_death || null,
        ahv_nr: form.ahv_nr,
        lang: form.lang,
        blood_type_id: form.blood_type_id,
        resp_coord_id: form.resp_coord_id,
        translate: form.translate,
      };
      const updated = await api.updatePatient(patient.id, update);
      setPatient(updated);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const setField = (key: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleAddContact = async () => {
    if (!patient || !ciForm.type_id || !ciForm.data.trim()) return;
    setCiSaving(true);
    try {
      await api.createContactInfo(patient.id, ciForm);
      await refreshPatient();
      setCiForm({ type_id: contactTypes[0]?.id ?? 0, data: '', comment: '', main: false });
      setAddingContact(false);
    } finally {
      setCiSaving(false);
    }
  };

  const handleDeleteContact = async (contactId: number) => {
    if (!patient) return;
    await api.deleteContactInfo(patient.id, contactId);
    setConfirmDeleteId(null);
    await refreshPatient();
  };

  const startEditingCi = (ci: { id: number; type_id: number; data: string; comment: string; main: boolean }) => {
    setEditingCiId(ci.id);
    setCiEditForm({ type_id: ci.type_id, data: ci.data, comment: ci.comment, main: ci.main });
    setConfirmDeleteId(null);
  };

  const cancelEditingCi = () => {
    setEditingCiId(null);
  };

  const handleSaveCi = async () => {
    if (!patient || editingCiId === null) return;
    setCiSaving(true);
    try {
      await api.updateContactInfo(patient.id, editingCiId, ciEditForm);
      setEditingCiId(null);
      await refreshPatient();
    } finally {
      setCiSaving(false);
    }
  };

  /* ── Absence handlers ── */

  const handleAddAbsence = async () => {
    if (!patient || !abForm.start || !abForm.end) return;
    setAbSaving(true);
    try {
      await api.createAbsence(patient.id, abForm);
      await refreshPatient();
      setAbForm({ start: '', end: '', comment: '' });
      setAddingAbsence(false);
    } finally {
      setAbSaving(false);
    }
  };

  const handleDeleteAbsence = async (id: number) => {
    if (!patient) return;
    await api.deleteAbsence(patient.id, id);
    setConfirmDeleteAbId(null);
    await refreshPatient();
  };

  const startEditingAb = (ab: { id: number; start: string; end: string; comment: string }) => {
    setEditingAbId(ab.id);
    setAbEditForm({ start: ab.start, end: ab.end, comment: ab.comment });
    setConfirmDeleteAbId(null);
  };

  const cancelEditingAb = () => {
    setEditingAbId(null);
  };

  const handleSaveAb = async () => {
    if (!patient || editingAbId === null) return;
    setAbSaving(true);
    try {
      await api.updateAbsence(patient.id, editingAbId, abEditForm);
      setEditingAbId(null);
      await refreshPatient();
    } finally {
      setAbSaving(false);
    }
  };

  /* ── Diagnosis handlers ── */

  const handleAddDiag = async () => {
    if (!patient || !diagForm.catalogue_id) return;
    setDiagSaving(true);
    try {
      await api.createDiagnosis(patient.id, diagForm);
      await refreshPatient();
      setDiagForm({ catalogue_id: diagCodes[0]?.id ?? 0, comment: '' });
      setAddingDiag(false);
    } finally {
      setDiagSaving(false);
    }
  };

  const handleDeleteDiag = async (id: number) => {
    if (!patient) return;
    await api.deleteDiagnosis(patient.id, id);
    setConfirmDeleteDiagId(null);
    await refreshPatient();
  };

  const startEditingDiag = (d: { id: number; catalogue_id: number; comment: string }) => {
    setEditingDiagId(d.id);
    setDiagEditForm({ catalogue_id: d.catalogue_id, comment: d.comment });
    setConfirmDeleteDiagId(null);
  };

  const cancelEditingDiag = () => {
    setEditingDiagId(null);
  };

  const handleSaveDiag = async () => {
    if (!patient || editingDiagId === null) return;
    setDiagSaving(true);
    try {
      await api.updateDiagnosis(patient.id, editingDiagId, diagEditForm);
      setEditingDiagId(null);
      await refreshPatient();
    } finally {
      setDiagSaving(false);
    }
  };

  /* ── Medical Value handlers ── */

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
    const templateMatchesOrgan = (tpl: MedicalValueTemplate, organKey: string) => {
      switch (organKey) {
        case 'kidney': return tpl.use_kidney;
        case 'liver': return tpl.use_liver;
        case 'heart': return tpl.use_heart;
        case 'lung': return tpl.use_lung;
        case 'donor': return tpl.use_donor;
        default: return false;
      }
    };
    const existingTplIds = new Set(patient.medical_values?.map((mv) => mv.medical_value_template_id).filter(Boolean));
    const openOrganKeys = new Set(
      (patient.episodes ?? [])
        .filter((ep) => !ep.closed)
        .map((ep) => ep.organ?.key ?? organCodes.find((c) => c.id === ep.organ_id)?.key ?? '')
        .filter((key) => key !== '')
        .map((key) => key.toLowerCase())
    );
    const eligible = mvTemplates.filter((tpl) => {
      if (tpl.use_base) return true;
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
      return (
        <select className={className} value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="">–</option>
          {entries.map((c) => (
            <option key={c.id} value={c.key}>{c.name_default}</option>
          ))}
        </select>
      );
    }
    if (cfg.inputType === 'boolean') {
      return (
        <select className={className} value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="">–</option>
          <option value="true">Yes</option>
          <option value="false">No</option>
        </select>
      );
    }
    return (
      <input
        className={className}
        type={cfg.inputType === 'number' ? 'number' : cfg.inputType === 'date' ? 'date' : 'text'}
        step={cfg.step}
        placeholder={cfg.placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    );
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
          if (aHas !== bHas) { cmp = aHas - bHas; return mvSortAsc ? cmp : -cmp; }
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
    if (fromIdx === -1 || toIdx === -1) { setMvDragId(null); setMvDragOverId(null); return; }
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

  const sortedContactInfos = patient?.contact_infos
    ? [...patient.contact_infos].sort((a, b) => (a.pos ?? 0) - (b.pos ?? 0))
    : [];

  const handleCiDrop = async (targetId: number) => {
    if (!patient || ciDragId === null || ciDragId === targetId) {
      setCiDragId(null);
      setCiDragOverId(null);
      return;
    }
    const ordered = [...sortedContactInfos];
    const fromIdx = ordered.findIndex((ci) => ci.id === ciDragId);
    const toIdx = ordered.findIndex((ci) => ci.id === targetId);
    if (fromIdx === -1 || toIdx === -1) { setCiDragId(null); setCiDragOverId(null); return; }
    const [moved] = ordered.splice(fromIdx, 1);
    ordered.splice(toIdx, 0, moved);
    setCiDragId(null);
    setCiDragOverId(null);
    setCiSaving(true);
    try {
      for (let i = 0; i < ordered.length; i++) {
        const newPos = i + 1;
        if (ordered[i].pos !== newPos) {
          await api.updateContactInfo(patient.id, ordered[i].id, { pos: newPos });
        }
      }
      await refreshPatient();
    } finally {
      setCiSaving(false);
    }
  };

  const sortedAbsences = patient?.absences
    ? [...patient.absences].sort((a, b) => b.end.localeCompare(a.end))
    : [];

  /* ── Episode handlers ── */

  const handleAddEpisode = async () => {
    if (!patient || !epForm.organ_id) return;
    setEpSaving(true);
    try {
      await api.createEpisode(patient.id, epForm);
      await refreshPatient();
      setEpForm({ organ_id: organCodes[0]?.id ?? 0 });
      setAddingEpisode(false);
    } finally {
      setEpSaving(false);
    }
  };

  const handleDeleteEpisode = async (id: number) => {
    if (!patient) return;
    await api.deleteEpisode(patient.id, id);
    setConfirmDeleteEpId(null);
    await refreshPatient();
  };

  const startEditingEp = (ep: {
    id: number; organ_id: number; start: string | null; end: string | null;
    fall_nr: string; status_id: number | null; closed: boolean;
    tpl_date: string | null; comment: string; cave: string;
    fup_recipient_card_done: boolean; fup_recipient_card_date: string | null;
  }) => {
    setEditingEpId(ep.id);
    setEpEditForm({
      organ_id: ep.organ_id, start: ep.start, end: ep.end,
      fall_nr: ep.fall_nr, status_id: ep.status_id, closed: ep.closed,
      tpl_date: ep.tpl_date, comment: ep.comment, cave: ep.cave,
      fup_recipient_card_done: ep.fup_recipient_card_done, fup_recipient_card_date: ep.fup_recipient_card_date,
    });
    setConfirmDeleteEpId(null);
  };

  const cancelEditingEp = () => { setEditingEpId(null); };

  const handleSaveEp = async () => {
    if (!patient || editingEpId === null) return;
    if (epEditForm.closed && !epEditForm.end) return;
    setEpSaving(true);
    try {
      await api.updateEpisode(patient.id, editingEpId, epEditForm);
      setEditingEpId(null);
      await refreshPatient();
    } finally {
      setEpSaving(false);
    }
  };

  if (loading) {
    return <p className="status">Loading...</p>;
  }

  if (!patient) {
    return <p className="status">Patient not found.</p>;
  }

  return (
    <div className="patient-detail">
      <div className="detail-heading">
        <button className="back-btn" onClick={onBack} title="Back to list">&larr;</button>
        <h1>{patient.first_name} {patient.name}</h1>
      </div>

      <nav className="detail-tabs">
        <button className={`detail-tab ${tab === 'patient' ? 'active' : ''}`} onClick={() => setTab('patient')}>Patient</button>
        <button className={`detail-tab ${tab === 'episodes' ? 'active' : ''}`} onClick={() => setTab('episodes')}>Episodes</button>
        <button className={`detail-tab ${tab === 'medical' ? 'active' : ''}`} onClick={() => setTab('medical')}>Medical Data</button>
      </nav>

      {tab === 'patient' && (
        <PatientTab
          patient={patient}
          editing={editing}
          startEditing={startEditing}
          saving={saving}
          handleSave={handleSave}
          cancelEditing={cancelEditing}
          form={form}
          setForm={setForm}
          setField={setField}
          formatDate={formatDate}
          languages={languages}
          bloodTypes={bloodTypes}
          coordUsers={coordUsers}
          addingContact={addingContact}
          setAddingContact={setAddingContact}
          sortedContactInfos={sortedContactInfos}
          editingCiId={editingCiId}
          ciEditForm={ciEditForm}
          setCiEditForm={setCiEditForm}
          ciSaving={ciSaving}
          handleSaveCi={handleSaveCi}
          cancelEditingCi={cancelEditingCi}
          ciDragId={ciDragId}
          ciDragOverId={ciDragOverId}
          setCiDragId={setCiDragId}
          setCiDragOverId={setCiDragOverId}
          handleCiDrop={handleCiDrop}
          startEditingCi={startEditingCi}
          confirmDeleteId={confirmDeleteId}
          setConfirmDeleteId={setConfirmDeleteId}
          handleDeleteContact={handleDeleteContact}
          contactTypes={contactTypes}
          ciForm={ciForm}
          setCiForm={setCiForm}
          handleAddContact={handleAddContact}
          addingAbsence={addingAbsence}
          setAddingAbsence={setAddingAbsence}
          sortedAbsences={sortedAbsences}
          editingAbId={editingAbId}
          abEditForm={abEditForm}
          setAbEditForm={setAbEditForm}
          abSaving={abSaving}
          handleSaveAb={handleSaveAb}
          cancelEditingAb={cancelEditingAb}
          startEditingAb={startEditingAb}
          confirmDeleteAbId={confirmDeleteAbId}
          setConfirmDeleteAbId={setConfirmDeleteAbId}
          handleDeleteAbsence={handleDeleteAbsence}
          abForm={abForm}
          setAbForm={setAbForm}
          handleAddAbsence={handleAddAbsence}
        />
      )}

      {tab === 'episodes' && (
        <EpisodesTab
          patient={patient}
          addingEpisode={addingEpisode}
          setAddingEpisode={setAddingEpisode}
          editingEpId={editingEpId}
          epEditForm={epEditForm}
          setEpEditForm={setEpEditForm}
          epSaving={epSaving}
          handleSaveEp={handleSaveEp}
          cancelEditingEp={cancelEditingEp}
          startEditingEp={startEditingEp}
          confirmDeleteEpId={confirmDeleteEpId}
          setConfirmDeleteEpId={setConfirmDeleteEpId}
          handleDeleteEpisode={handleDeleteEpisode}
          organCodes={organCodes}
          tplStatusCodes={tplStatusCodes}
          epForm={epForm}
          setEpForm={setEpForm}
          handleAddEpisode={handleAddEpisode}
          formatDate={formatDate}
          refreshPatient={refreshPatient}
        />
      )}

      {tab === 'medical' && (
        <MedicalDataTab
          patient={patient}
          editing={editing}
          startEditing={startEditing}
          saving={saving}
          handleSave={handleSave}
          cancelEditing={cancelEditing}
          form={form}
          setForm={setForm}
          bloodTypes={bloodTypes}
          addingDiag={addingDiag}
          setAddingDiag={setAddingDiag}
          diagCodes={diagCodes}
          diagForm={diagForm}
          setDiagForm={setDiagForm}
          diagSaving={diagSaving}
          handleAddDiag={handleAddDiag}
          editingDiagId={editingDiagId}
          diagEditForm={diagEditForm}
          setDiagEditForm={setDiagEditForm}
          handleSaveDiag={handleSaveDiag}
          cancelEditingDiag={cancelEditingDiag}
          startEditingDiag={startEditingDiag}
          confirmDeleteDiagId={confirmDeleteDiagId}
          setConfirmDeleteDiagId={setConfirmDeleteDiagId}
          handleDeleteDiag={handleDeleteDiag}
          formatDate={formatDate}
          addingMv={addingMv}
          setAddingMv={setAddingMv}
          handleAddAllMv={handleAddAllMv}
          mvSaving={mvSaving}
          sortedMedicalValues={sortedMedicalValues}
          toggleMvSort={toggleMvSort}
          mvSortIndicator={mvSortIndicator}
          editingMvId={editingMvId}
          mvEditForm={mvEditForm}
          setMvEditForm={setMvEditForm}
          mvTemplates={mvTemplates}
          renderValueInput={renderValueInput}
          resolveDt={resolveDt}
          handleSaveMv={handleSaveMv}
          cancelEditingMv={cancelEditingMv}
          validateValue={validateValue}
          confirmDeleteMvId={confirmDeleteMvId}
          setConfirmDeleteMvId={setConfirmDeleteMvId}
          handleDeleteMv={handleDeleteMv}
          startEditingMv={startEditingMv}
          mvSortKey={mvSortKey}
          mvSortAsc={mvSortAsc}
          mvDragId={mvDragId}
          mvDragOverId={mvDragOverId}
          setMvDragId={setMvDragId}
          setMvDragOverId={setMvDragOverId}
          handleMvDrop={handleMvDrop}
          formatValue={formatValue}
          catalogueCache={catalogueCache}
          getCatalogueType={getCatalogueType}
          mvAddMode={mvAddMode}
          setMvAddMode={setMvAddMode}
          mvForm={mvForm}
          setMvForm={setMvForm}
          datatypeCodes={datatypeCodes}
          handleAddMv={handleAddMv}
        />
      )}
    </div>
  );
}
