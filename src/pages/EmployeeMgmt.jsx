import { useEffect, useState } from 'react';
import styles from './styles/EmployeeMgmt.module.css';

export default function EmployeeMgmt() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Controlled form values
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    role: 'employee',
    department_id: '1' // Pre-mapped to Engineering from our seed step
  });

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/employees');
      const json = await res.json();
      if (json.status === 'success') {
        setEmployees(json.data);
      }
    } catch (err) {
      console.error('Error contacting system directory API:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          department_id: parseInt(formData.department_id) || null
        })
      });
      
      const json = await res.json();
      
      if (json.status === 'success') {
        alert('Employee onboarding recorded successfully!');
        setFormData({ first_name: '', last_name: '', email: '', role: 'employee', department_id: '1' });
        fetchEmployees(); // Live update directory table UI view panel
      } else {
        alert(json.error || 'Onboarding registration failed.');
      }
    } catch (err) {
      alert('Network failure processing transaction: ' + err.message);
    }
  };

  return (
    <div className={styles.pageContainer}>
      {/* LEFT COLUMN - ADD EMPLOYEE FORM */}
      <section className={styles.formSection}>
        <h3 style={{ marginTop: 0, marginBottom: '1.5rem' }}>Onboard Employee</h3>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label>First Name</label>
            <input type="text" name="first_name" value={formData.first_name} onChange={handleChange} required className={styles.inputField} placeholder="Jane" />
          </div>

          <div className={styles.formGroup}>
            <label>Last Name</label>
            <input type="text" name="last_name" value={formData.last_name} onChange={handleChange} required className={styles.inputField} placeholder="Doe" />
          </div>

          <div className={styles.formGroup}>
            <label>Work Email</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} required className={styles.inputField} placeholder="jane.doe@company.com" />
          </div>

          <div className={styles.formGroup}>
            <label>System Permissions Role</label>
            <select name="role" value={formData.role} onChange={handleChange} className={styles.selectField}>
              <option value="employee">Employee</option>
              <option value="manager">Manager</option>
              <option value="hr">HR Personnel</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Primary Assigned Department</label>
            <select name="department_id" value={formData.department_id} onChange={handleChange} className={styles.selectField}>
              <option value="1">Engineering (ID: 1)</option>
              <option value="2">Human Resources (ID: 2)</option>
            </select>
          </div>

          <button type="submit" className={styles.submitBtn}>Save Record</button>
        </form>
      </section>

      {/* RIGHT COLUMN - DIRECTORY DATA LIST TABLE */}
      <section className={styles.tableContainer}>
        <h3 style={{ marginTop: 0 }}>Active Corporate Directory</h3>
        
        {loading ? (
          <p>Syncing staff information database lists...</p>
        ) : employees.length === 0 ? (
          <p style={{ color: '#666', fontStyle: 'italic' }}>No employee records found in your environment instance setup.</p>
        ) : (
          <table className={styles.employeeTable}>
            <thead>
              <tr>
                <th>System ID</th>
                <th>Full Name</th>
                <th>Email Address</th>
                <th>Department</th>
                <th>Access Status Role</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp.id}>
                  <td><code>#{emp.id}</code></td>
                  <td><strong>{emp.first_name} {emp.last_name}</strong></td>
                  <td>{emp.email}</td>
                  <td>{emp.department_name || 'Unassigned'}</td>
                  <td>
                    <span className={`${styles.roleBadge} ${styles['badge-' + emp.role]}`}>
                      {emp.role}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}