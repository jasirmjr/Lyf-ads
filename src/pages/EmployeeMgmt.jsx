import { useEffect, useState } from 'react';
import styles from './styles/EmployeeMgmt.module.css';

export default function EmployeeMgmt() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'employee',
    phone: '',
    department_id: '1'
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
      console.error(err);
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
        alert('Employee onboarded successfully!');
        setFormData({ name: '', email: '', role: 'employee', phone: '', department_id: '1' });
        fetchEmployees();
      } else {
        alert(json.error || 'Submission error');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className={styles.pageContainer}>
      {/* REDESIGNED FORM CARD */}
      <section className={styles.formSection}>
        <h3 className={styles.formTitle}>Onboard Employee</h3>
        <form onSubmit={handleSubmit}>
          
          <div className={styles.formGroup}>
            <label>Full Name</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} required className={styles.inputField} placeholder="e.g. Jane Doe" />
          </div>

          <div className={styles.formGroup}>
            <label>Work Email</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} required className={styles.inputField} placeholder="jane.doe@company.com" />
          </div>

          <div className={styles.formGroup}>
            <label>Mobile Number</label>
            <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className={styles.inputField} placeholder="+1 (555) 000-0000" />
          </div>

          <div className={styles.formGroup}>
            <label>Role</label>
            <select name="role" value={formData.role} onChange={handleChange} className={styles.selectField}>
              <option value="employee">Employee</option>
              <option value="manager">Manager</option>
              <option value="hr">HR Personnel</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Department</label>
            <select name="department_id" value={formData.department_id} onChange={handleChange} className={styles.selectField}>
              <option value="1">Engineering</option>
              <option value="2">Human Resources</option>
            </select>
          </div>

          <button type="submit" className={styles.submitBtn}>Save Record</button>
        </form>
      </section>

      {/* DIRECTORY VIEW PANEL */}
      <section className={styles.tableContainer}>
        <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Active Corporate Directory</h3>
        {loading ? (
          <p>Loading directory...</p>
        ) : (
          <table className={styles.employeeTable}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Full Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Department</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp.id}>
                  <td><code>#{emp.id}</code></td>
                  <td><strong>{emp.first_name} {emp.last_name}</strong></td>
                  <td>{emp.email}</td>
                  <td>{emp.phone || '—'}</td>
                  <td>{emp.department_name || 'Unassigned'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}