import React, { useState, useEffect } from 'react';
export const CollectionEditor = ({ items, schema, onChange, }) => {
    const [entries, setEntries] = useState(items);
    useEffect(() => {
        setEntries(items);
    }, [items]);
    const addEntry = () => {
        const newEntry = schema.properties.reduce((acc, prop) => {
            acc[prop.name] = prop.default || '';
            return acc;
        }, {});
        const newEntries = [...entries, newEntry];
        setEntries(newEntries);
        onChange(newEntries);
    };
    const updateEntry = (index, field, value) => {
        const newEntries = [...entries];
        newEntries[index] = Object.assign(Object.assign({}, newEntries[index]), { [field]: value });
        setEntries(newEntries);
        onChange(newEntries);
    };
    const removeEntry = (index) => {
        const newEntries = entries.filter((_, i) => i !== index);
        setEntries(newEntries);
        onChange(newEntries);
    };
    const renderField = (prop, value, onFieldChange) => {
        var _a;
        switch (prop.type) {
            case 'string':
                return (<input type="text" value={value || ''} onChange={(e) => onFieldChange(e.target.value)} placeholder={prop.displayName} className="collection-input"/>);
            case 'number':
                return (<input type="number" value={value || ''} onChange={(e) => onFieldChange(Number(e.target.value))} placeholder={prop.displayName} className="collection-input"/>);
            case 'boolean':
                return (<input type="checkbox" checked={value || false} onChange={(e) => onFieldChange(e.target.checked)} className="collection-checkbox"/>);
            case 'options':
                return (<select value={value || ''} onChange={(e) => onFieldChange(e.target.value)} className="collection-select">
            <option value="">Select {prop.displayName}</option>
            {(_a = prop.options) === null || _a === void 0 ? void 0 : _a.map((opt) => (<option key={opt.value} value={opt.value}>
                {opt.name}
              </option>))}
          </select>);
            default:
                return (<input type="text" value={value || ''} onChange={(e) => onFieldChange(e.target.value)} placeholder={prop.displayName} className="collection-input"/>);
        }
    };
    return (<div className="collection-editor">
      {entries.map((entry, index) => (<div key={index} className="collection-item">
          <div className="collection-item-header">
            <span>Item {index + 1}</span>
            <button onClick={() => removeEntry(index)} className="remove-button" type="button">
              ✕
            </button>
          </div>
          <div className="collection-item-fields">
            {schema.properties.map((prop) => (<div key={prop.name} className="collection-field">
                <label>
                  {prop.displayName}
                  {prop.required && <span className="required">*</span>}
                </label>
                {renderField(prop, entry[prop.name], (value) => updateEntry(index, prop.name, value))}
              </div>))}
          </div>
        </div>))}
      <button onClick={addEntry} className="add-button" type="button">
        Add Item
      </button>
    </div>);
};
//# sourceMappingURL=CollectionEditor.js.map