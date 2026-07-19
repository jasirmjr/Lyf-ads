import { useState, useEffect } from 'react';
import styles from './styles/OrgSettings.module.css';

export default function OrgSettings() {
  const [structure, setStructure] = useState([]);
  const [newDept, setNewDept] = useState('');
  const [newRole, setNewRole] = useState({ department_id: '', role_name: '' });

  const loadOrgData = async () => {
    const res = await fetch('/api/departments');
    const json = await res.json();
    if (json.status === 'success') setStructure(json.data);
  };

  useEffect(() => { loadOrgData(); }, []);

  const handleAddDept = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/departments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newDept })
    });
    if (res.ok) { setNewDept(''); loadOrgData(); }
  };

  const handleAddRole = async (e) => {
    e.preventDefault();
    if (!newRole.department_id) return alert('Select a department first.');
    const res = await fetch('/api/departments/roles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRole)
    });
    if (res.ok) { setNewRole({ department_id: '', role_name: '' }); loadOrgData(); }
  };

  // ACTION: Delete Entire Department
  const handleDeleteDept = async (id, name) => {
    if (window.confirm(`Delete department "${name}"? This will clear all sub-roles inside it!`)) {
      const res = await fetch(`/api/departments/${id}`, { method: 'DELETE' });
      if (res.ok) loadOrgData();
    }
  };

  // ACTION: Delete Specific Role
  const handleDeleteRole = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete the role "${name}"?`)) {
      const res = await fetch(`/api/departments/roles/${id}`, { method: 'DELETE' });
      if (res.ok) loadOrgData();
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div>
        {/* Department Creator */}
        <section className={styles.cardSection}>
          <h3 className={styles.title}>🏢 Create Department</h3>
          <form onSubmit={handleAddDept} className={styles.formRow}>
            <input type="text" placeholder="e.g., Marketing" value={newDept} onChange={e => setNewDept(e.target.value)} required className={styles.inputField} />
            <button type="submit" className={styles.submitBtn}>Add</button>
          </form>
        </section>

        {/* Role Creator */}
        <section className={styles.cardSection}>
          <h3 className={styles.title}>🔑 Add Role to Department</h3>
          <form onSubmit={handleAddRole}>
            <select value={newRole.department_id} onChange={e => setNewRole({ ...newRole, department_id: e.target.value })} required className={styles.selectField}>
              <option value="">-- Select Target Department --</option>
              {structure.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <input type="text" placeholder="e.g., UI Designer" value={newRole.role_name} onChange={e => setNewRole({ ...newRole, role_name: e.target.value })} required className={styles.inputField} style={{ width: '100%', marginBottom: '10px', boxSizing: 'border-box' }} />
            <button type="submit" className={styles.submitBtn} style={{ width: '100%' }}>Save Sub-Role</button>
          </form>
        </section>
      </div>

      {/* Structure View with Deletion Controls */}
      <section className={styles.cardSection}>
        <h3 className={styles.title}>Current Organization Structure Map</h3>
        {structure.map(d => (
          <div key={d.id} className={styles.orgMapItem}>
            <div className={styles.deptHeaderRow}>
              <strong>🏢 {d.name}</strong>
              <button onClick={() => handleDeleteDept(d.id, d.name)} className={styles.inlineDeleteBtn}>
                🗑️ Delete Dept
              </button>
            </div>
            
            <ul style={{ margin: '5px 0 0 0', paddingLeft: '15px', listStyleType: 'none' }}>
              {d.roles.length === 0 ? (
                <li className={styles.emptyRole}>No sub-roles configured</li>
              ) : (
                d.roles.map(r => (
                  <li key={r.id} className={styles.roleItemRow}>
                    <span className={styles.roleList}>🏷️ {r.role_name}</span>
                    <button onClick={() => handleDeleteRole(r.id, r.role_name)} className={styles.inlineDeleteBtn} style={{ padding: '0px 4px' }}>
                      ✕
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        ))}
      </section>
    </div>
  );
}