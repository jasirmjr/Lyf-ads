import { useEffect, useState } from 'react';
import styles from './styles/EmployeeMgmt.module.css';

export default function EmployeeMgmt() {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', department_id: '', design_role_id: ''
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const empRes = await fetch('/api/employees');
      const empJson = await empRes.json();
      if (empJson.status === 'success') setEmployees(empJson.data);

      const deptRes = await fetch('/api/departments');
      const deptJson = await deptRes.json();
      if (deptJson.status === 'success' && deptJson.data.length > 0) {
        setDepartments(deptJson.data);
        
        const firstDept = deptJson.data[0];
        const firstRole = firstDept.roles && firstDept.roles.length > 0 ? firstDept.roles[0].id.toString() : '';
        
        setFormData(prev => ({
          ...prev,
          department_id: firstDept.id.toString(),
          design_role_id: firstRole
        }));
        setAvailableRoles(firstDept.roles || []);
      }
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const handleDeptChange = (e) => {
    const selectedDeptId = e.target.value;
    const matchedDept = departments.find(d => d.id.toString() === selectedDeptId);
    const primaryRole = matchedDept && matchedDept.roles.length > 0 ? matchedDept.roles[0].id.toString() : '';
    
    setFormData(prev => ({ 
      ...prev, 
      department_id: selectedDeptId, 
      design_role_id: primaryRole 
    }));
    setAvailableRoles(matchedDept ? matchedDept.roles : []);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          department_id: formData.department_id,
          design_role_id: formData.design_role_id
        })
      });
      if (res.ok) {
        alert('Employee onboarded successfully!');
        setFormData(prev => ({ ...prev, name: '', email: '', phone: '' }));
        loadData();
      }
    } catch (err) { alert(err.message); }
  };

  // TRIGGER TRANSACTION: Delete Action execution
  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you absolutely sure you want to completely offboard ${name}?`)) {
      try {
        const res = await fetch(`/api/employees/${id}`, { method: 'DELETE' });
        const json = await res.json();
        if (json.status === 'success') {
          loadData(); // Re-sync table grid records lists instantly
        } else {
          alert(json.error || 'Could not complete operation.');
        }
      } catch (err) {
        alert('Failed to connect to the database server.');
      }
    }
  };

  return (
    <div className={styles.pageContainer}>
      
      {/* FULL WIDTH FORM LAYOUT WRAPPER */}
      <section className={styles.formSection}>
        <h3 className={styles.formTitle}>Onboard Employee</h3>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGrid}>
            
            <div className={styles.formGroup}>
              <label>Full Name</label>
              <input type="text" placeholder="e.g. Jane Doe" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required className={styles.inputField} />
            </div>
            
            <div className={styles.formGroup}>
              <label>Work Email</label>
              <input type="email" placeholder="jane.doe@company.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required className={styles.inputField} />
            </div>
            
            <div className={styles.formGroup}>
              <label>Mobile Number</label>
              <input type="text" placeholder="+1 (555) 000-0000" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className={styles.inputField} />
            </div>
            
            <div className={styles.formGroup}>
              <label>Department</label>
              <select value={formData.department_id} onChange={handleDeptChange} className={styles.selectField}>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Sub-Role</label>
              <select value={formData.design_role_id} onChange={e => setFormData({...formData, design_role_id: e.target.value})} required className={styles.selectField}>
                <option value="">-- Choose Mapped Role --</option>
                {availableRoles.map(r => <option key={r.id} value={r.id}>{r.role_name}</option>)}
              </select>
            </div>

            <button type="submit" className={styles.submitBtn}>Save Record</button>
          </div>
        </form>
      </section>

      {/* FULL WIDTH EXPANDED DIRECTORY DISPLAY LIST */}
      <section className={styles.tableContainer}>
        <h3 style={{ marginTop: 0, marginBottom: '1.25rem' }}>Active Corporate Directory</h3>
        {loading ? <p>Loading directory data metrics...</p> : (
          <div style={{ overflowX: 'auto' }}>
            <table className={styles.employeeTable}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Full Name</th>
                  <th>Email Address</th>
                  <th>Phone</th>
                  <th>Department</th>
                  <th>Role Assignment</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map(emp => (
                  <tr key={emp.id}>
                    <td><code>#{emp.id}</code></td>
                    <td><strong>{emp.first_name} {emp.last_name}</strong></td>
                    <td>{emp.email}</td>
                    <td>{emp.phone || '—'}</td>
                    <td>{emp.department_name}</td>
                    <td>{emp.role_name || <span style={{ color: '#aaa', fontStyle: 'italic' }}>Unassigned</span>}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button 
                        onClick={() => handleDelete(emp.id, `${emp.first_name} ${emp.last_name}`)}
                        className={styles.deleteBtn}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

    </div>
  );
}