import React, { useEffect, useState } from 'react';
export const CredentialSelector = ({ credentialType, value, onChange, }) => {
    const [credentials, setCredentials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        const fetchCredentials = async () => {
            try {
                const response = await fetch(`/api/n8n/credentials/${credentialType}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch credentials');
                }
                const data = await response.json();
                setCredentials(data);
                setLoading(false);
            }
            catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };
        fetchCredentials();
    }, [credentialType]);
    if (loading) {
        return <div className="credential-selector loading">Loading credentials...</div>;
    }
    if (error) {
        return <div className="credential-selector error">Error: {error}</div>;
    }
    return (<div className="credential-selector">
      <label className="credential-label">
        Credentials
        <span className="required">*</span>
      </label>
      <select value={value || ''} onChange={(e) => onChange(e.target.value)} className="credential-select">
        <option value="">Select credentials</option>
        {credentials.map((cred) => (<option key={cred.id} value={cred.id}>
            {cred.name}
          </option>))}
      </select>
      <button onClick={() => {
            
        }} className="create-credential-button" type="button">
        Create New Credentials
      </button>
    </div>);
};
//# sourceMappingURL=CredentialSelector.js.map