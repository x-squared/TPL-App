import { useState } from 'react';

type FieldKey = 'fieldA' | 'fieldB';

interface FieldState {
  value: string;
  committed: boolean;
}

export default function CoordinationProtocolDataPanel() {
  const [fields, setFields] = useState<Record<FieldKey, FieldState>>({
    fieldA: { value: '', committed: false },
    fieldB: { value: '', committed: false },
  });

  const handleChange = (key: FieldKey, value: string) => {
    setFields((prev) => ({
      ...prev,
      [key]: {
        value,
        committed: value.trim().length > 0 ? prev[key].committed : false,
      },
    }));
  };

  const commitField = (key: FieldKey) => {
    setFields((prev) => ({
      ...prev,
      [key]: {
        value: prev[key].value,
        committed: prev[key].value.trim().length > 0,
      },
    }));
  };

  const inputStateClass = (key: FieldKey): string => {
    const current = fields[key];
    if (current.committed) {
      return 'committed';
    }
    if (current.value.trim().length === 0) {
      return 'pending';
    }
    return 'editing';
  };

  return (
    <section className="coord-protocol-pane coord-protocol-data-pane">
      <div className="detail-field">
        <span className="detail-label">Example field 1</span>
        <input
          type="text"
          className={`detail-input coord-protocol-data-input ${inputStateClass('fieldA')}`}
          value={fields.fieldA.value}
          onChange={(event) => handleChange('fieldA', event.target.value)}
          onBlur={() => commitField('fieldA')}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              commitField('fieldA');
              event.currentTarget.blur();
            }
          }}
        />
      </div>
      <div className="detail-field">
        <span className="detail-label">Example field 2</span>
        <input
          type="text"
          className={`detail-input coord-protocol-data-input ${inputStateClass('fieldB')}`}
          value={fields.fieldB.value}
          onChange={(event) => handleChange('fieldB', event.target.value)}
          onBlur={() => commitField('fieldB')}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              commitField('fieldB');
              event.currentTarget.blur();
            }
          }}
        />
      </div>
      <div className="coord-protocol-data-separator" aria-hidden="true" />
    </section>
  );
}
