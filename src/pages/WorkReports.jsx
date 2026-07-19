import { useEffect, useState } from 'react';
import styles from './styles/WorkReports.module.css';

export default function WorkReports({ user }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0], // Default to current date string
    project_name: '',
    work_status: 'Completed',
    start_time: '09:00',
    end_time: '17:00',
    remarks: ''
  });

    const fetchReports = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        // Append query parameters so the backend knows who is asking for the logs
        const res = await fetch(`/api/reports?employee_id=${user.id}&role=${user.role}`);
        const json = await res.json();
        if (json.status === 'success') {
          setReports(json.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          employee_id: user.id
        })
      });
      const json = await res.json();
      if (json.status === 'success') {
        alert('Daily work report logged successfully!');
        setFormData({
          date: new Date().toISOString().split('T')[0],
          project_name: '',
          work_status: 'Completed',
          start_time: '09:00',
          end_time: '17:00',
          remarks: ''
        });
        fetchReports();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className={styles.pageContainer}>
      {/* EXPANDED SUBMISSION CARD */}
      <section className={styles.formSection}>
        <h2 style={{ marginTop: 0, marginBottom: '1.5rem' }}>Submit Daily Report</h2>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGrid}>
            
            <div className={styles.formGroup}>
              <label>Employee Name</label>
              <input type="text" className={styles.disabledField} value={user?.name || ''} disabled />
            </div>

            <div className={styles.formGroup}>
              <label>Department</label>
              <input type="text" className={styles.disabledField} value={user?.department || 'General Operations'} disabled />
            </div>

            <div className={styles.formGroup}>
              <label>Date</label>
              <input 
                type="date" 
                name="date" 
                value={formData.date} 
                onChange={handleChange} 
                
                // CRITICAL: Lock the calendar picker strictly to today's date
                min={new Date().toISOString().split('T')[0]}
                max={new Date().toISOString().split('T')[0]}
                
                required 
                className={styles.inputField} 
              />
            </div>

            <div className={styles.formGroup}>
              <label>Task / Project Name</label>
              <input type="text" name="project_name" value={formData.project_name} onChange={handleChange} required className={styles.inputField} placeholder="e.g. CoreHR Authentication" />
            </div>

            <div className={styles.formGroup}>
              <label>Work Status</label>
              <select name="work_status" value={formData.work_status} onChange={handleChange} className={styles.selectField}>
                <option value="Completed">Completed</option>
                <option value="In Progress">In Progress</option>
                <option value="Delayed">Delayed</option>
                <option value="On Hold">On Hold</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Start Time</label>
              <input type="time" name="start_time" value={formData.start_time} onChange={handleChange} required className={styles.inputField} />
            </div>

            <div className={styles.formGroup}>
              <label>End Time</label>
              <input type="time" name="end_time" value={formData.end_time} onChange={handleChange} required className={styles.inputField} />
            </div>

            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <label>Remarks / Notes</label>
              <textarea name="remarks" value={formData.remarks} onChange={handleChange} className={styles.inputField} style={{ minHeight: '60px' }} placeholder="Detail specific items completed or bottlenecks encountered..." />
            </div>

          </div>
          <button type="submit" className={styles.submitBtn}>Submit Report</button>
        </form>
      </section>

      {/* HISTORICAL WORK LOG VIEW TABLE */}
      <section className={styles.logsSection}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ margin: 0 }}>
            {user?.role === 'hr' || user?.role === 'manager' ? "Today's Attendance & Report Status" : "My Work Logs History"}
          </h3>
          {user?.role === 'hr' && (
            <span style={{ fontSize: '0.85rem', color: '#6b7280', fontWeight: '500' }}>
              📅 Target Date: {new Date().toLocaleDateString()} (Today)
            </span>
          )}
        </div>

        {loading ? (
          <p>Syncing log updates...</p>
        ) : reports.length === 0 ? (
          <p style={{ color: '#666', fontStyle: 'italic' }}>No employee records found.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f4f4f4', borderBottom: '2px solid #ddd' }}>
                  <th style={{ padding: '12px 10px' }}>Employee</th>
                  <th style={{ padding: '12px 10px' }}>Department</th>
                  {user?.role === 'hr' && <th style={{ padding: '12px 10px' }}>Daily Status</th>}
                  <th style={{ padding: '12px 10px' }}>Project/Task</th>
                  <th style={{ padding: '12px 10px' }}>Work Status</th>
                  <th style={{ padding: '12px 10px' }}>Duration</th>
                  <th style={{ padding: '12px 10px' }}>Remarks / Notes</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r, index) => {
                  const isHRView = user?.role === 'hr' || user?.role === 'manager';
                  const hasSubmitted = isHRView ? r.submission_status === 'Submitted' : true;

                  return (
                    <tr key={isHRView ? `emp-${r.employee_id}-${index}` : r.id} style={{ borderBottom: '1px solid #eee', opacity: hasSubmitted ? 1 : 0.75 }}>
                      <td style={{ padding: '12px 10px' }}><strong>{r.employee_name}</strong></td>
                      <td style={{ padding: '12px 10px' }}>{r.department_name || 'Unassigned'}</td>
                      
                      {/* SUBMISSION TARGET INDICATOR STATUS TAGS (For HR Eyes Only) */}
                      {isHRView && (
                        <td style={{ padding: '12px 10px' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '4px 10px',
                            borderRadius: '20px',
                            fontSize: '0.75rem',
                            fontWeight: '700',
                            backgroundColor: hasSubmitted ? '#d1fae5' : '#fee2e2',
                            color: hasSubmitted ? '#065f46' : '#991b1b'
                          }}>
                            {r.submission_status}
                          </span>
                        </td>
                      )}

                      {/* DATA REPORT PARAMETERS DISPLAY CONTAINER */}
                      <td style={{ padding: '12px 10px' }}>{hasSubmitted ? r.project_name : <span style={{color: '#aaa', fontStyle: 'italic'}}>— Not Started —</span>}</td>
                      <td style={{ padding: '12px 10px' }}>
                        {hasSubmitted ? (
                          <span style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '0.8rem',
                            fontWeight: 'bold',
                            backgroundColor: r.work_status === 'Completed' ? '#e6f4ea' : '#ffe7d9',
                            color: r.work_status === 'Completed' ? '#137333' : '#b06000'
                          }}>
                            {r.work_status}
                          </span>
                        ) : '—'}
                      </td>
                      <td style={{ padding: '12px 10px' }}>
                        {hasSubmitted && r.start_time ? <code>{r.start_time.substring(0, 5)} - {r.end_time.substring(0, 5)}</code> : '—'}
                      </td>
                      <td style={{ padding: '12px 10px', color: '#555', maxWidth: '250px', wordBreak: 'break-word' }}>
                        {hasSubmitted ? (r.remarks || <span style={{ color: '#ccc', fontStyle: 'italic' }}>None</span>) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}