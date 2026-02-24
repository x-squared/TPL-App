import './PatientTab.css';
import AbsencesSection from './patient/AbsencesSection';
import ContactsSection from './patient/ContactsSection';
import PatientDataSection from './patient/PatientDataSection';
import type { PatientTabProps } from './patient/types';

export default function PatientTab(props: PatientTabProps) {
  const {
    patient,
    editing,
    startEditing,
    saving,
    handleSave,
    cancelEditing,
    form,
    setForm,
    setField,
    formatDate,
    languages,
    bloodTypes,
    coordUsers,
    addingContact,
    setAddingContact,
    sortedContactInfos,
    editingCiId,
    ciEditForm,
    setCiEditForm,
    ciSaving,
    handleSaveCi,
    cancelEditingCi,
    ciDragId,
    ciDragOverId,
    setCiDragId,
    setCiDragOverId,
    handleCiDrop,
    startEditingCi,
    confirmDeleteId,
    setConfirmDeleteId,
    handleDeleteContact,
    contactTypes,
    ciForm,
    setCiForm,
    handleAddContact,
    addingAbsence,
    setAddingAbsence,
    sortedAbsences,
    editingAbId,
    abEditForm,
    setAbEditForm,
    abSaving,
    handleSaveAb,
    cancelEditingAb,
    startEditingAb,
    confirmDeleteAbId,
    setConfirmDeleteAbId,
    handleDeleteAbsence,
    abForm,
    setAbForm,
    handleAddAbsence,
  } = props;

  return (
    <>
      <div className="detail-tab-toolbar">
        {!editing ? (
          <button className="edit-btn" onClick={startEditing}>Edit</button>
        ) : (
          <div className="edit-actions">
            <button className="save-btn" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button className="cancel-btn" onClick={cancelEditing} disabled={saving}>Cancel</button>
          </div>
        )}
      </div>

      <PatientDataSection
        patient={patient}
        editing={editing}
        form={form}
        setForm={setForm}
        setField={setField}
        formatDate={formatDate}
        languages={languages}
        bloodTypes={bloodTypes}
        coordUsers={coordUsers}
      />

      <ContactsSection
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
      />

      <AbsencesSection
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
        formatDate={formatDate}
      />
    </>
  );
}
