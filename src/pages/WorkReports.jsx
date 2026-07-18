import { useEffect, useState } from 'react';
import styles from './styles/WorkReports.module.css'; // Import page styles

export default function WorkReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    employee_id: '1', project_id: '1', hours_worked: '', tasks_input: '', blockers: '', status: 'submitted'
  });
  const [searchFilter, setSearchFilter] = useState('');

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/reports');
      const json = await res.json();
      if (json.status === 'success') setReports(json.data);
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchReports(); }, []);

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    const tasksArray = formData.tasks_input.split(',').map(t => t.trim()).filter(t => t.length > 0);
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          employee_id: parseInt(formData.employee_id),
          project_id: parseInt(formData.project_id),
          hours_worked: parseFloat(formData.hours_worked),
          tasks_completed: tasksArray
        })
      });
      const json = await res.json();
      if (json.status === 'success') {
        alert('Report logged!');
        setFormData({ employee_id: '1', project_id: '1', hours_worked: '', tasks_input: '', blockers: '', status: 'submitted' });
        fetchReports();
      }
    } catch (err) { alert(err.message); }
  };

  const filteredReports = reports.filter(r => 
    `${r.first_name} ${r.last_name}`.toLowerCase().includes(searchFilter.toLowerCase()) ||
    r.tasks_completed.join(' ').toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className={styles.pageContainer}>
      <section className={styles.formSection}>
        <h3>Submit Daily Report</h3>
        <form onSubmit={handleSubmitReport}>
          <input type="number" step="0.25" placeholder="Hours" value={formData.hours_worked} onChange={e => setFormData({...formData, hours_worked: e.target.value})} required className={styles.inputField} />
          <textarea placeholder="Tasks (comma separated)" value={formData.tasks_input} onChange={e => setFormData({...formData, tasks_input: e.target.value})} required className={styles.textareaField} />
          <input type="text" placeholder="Blockers" value={formData.blockers} onChange={e => setFormData({...formData, blockers: e.target.value})} className={styles.inputField} />
          <button type="submit" className={styles.submitBtn}>Submit</button>
        </form>
      </section>

      <section>
        <div className={styles.headerRow}>
          <h3>All Work Logs</h3>
          <input type="text" placeholder="Filter..." value={searchFilter} onChange={e => setSearchFilter(e.target.value)} style={{padding: '5px'}}/>
        </div>
        {loading ? <p>Loading...</p> : filteredReports.map(r => (
          <div key={r.id} className={styles.reportCard}>
            <strong>{r.first_name} {r.last_name}</strong> - {r.hours_worked} Hours
            <ul>{r.tasks_completed.map((t, i) => <li key={i}>{t}</li>)}</ul>
          </div>
        ))}
      </section>
    </div>
  );
}