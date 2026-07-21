import { useEffect, useState } from 'react';
import styles from './styles/WorkReports.module.css';

export default function WorkReports({ user }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Dashboard Active Grid Views States
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [statusFilter, setStatusFilter] = useState('All'); 

  // 2. NEW: PDF Advanced Filter Target Configuration States
  const [pdfTimeMode, setPdfTimeMode] = useState('SpecificDay'); // 'SpecificDay' or 'MonthView'
  const [pdfSelectedDate, setPdfSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [pdfSelectedMonth, setPdfSelectedMonth] = useState(new Date().toISOString().split('Y-m')[0].substring(0, 7)); // e.g., '2026-07'
  const [pdfStatusFilter, setPdfStatusFilter] = useState('All'); // 'All', 'Submitted', 'Pending'
  const [isPrinting, setIsPrinting] = useState(false);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
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
      // Fetch data based on screen display date picker
      const res = await fetch(`/api/reports?employee_id=${user.id}&role=${user.role}&date=${selectedDate}`);
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
  }, [selectedDate, user]);

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
        body: JSON.stringify({ ...formData, employee_id: user.id })
      });
      if (res.ok) {
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

  const isHRView = user?.role === 'hr' || user?.role === 'manager';

  // Normal Screen Filtering Logic
  const filteredReports = reports.filter((r) => {
    if (!isHRView || statusFilter === 'All') return true;
    return r.submission_status === statusFilter;
  });

  // NEW: Advanced PDF Generation Engine
  const triggerPDFDownload = async () => {
    try {
      setLoading(true);
      
      let fetchUrl = `/api/reports?employee_id=${user.id}&role=${user.role}`;
      if (pdfTimeMode === 'SpecificDay') {
        fetchUrl += `&date=${pdfSelectedDate}`;
      } else {
        fetchUrl += `&date=${pdfSelectedMonth}-01&range=month`; 
      }

      const res = await fetch(fetchUrl);
      const json = await res.json();
      
      if (json.status === 'success') {
        let rawPdfData = json.data;

        if (pdfTimeMode === 'MonthView') {
          rawPdfData = rawPdfData.filter(r => r.date && r.date.startsWith(pdfSelectedMonth));
        }

        const targetedPdfRows = rawPdfData.filter(r => {
          if (pdfStatusFilter === 'All') return true;
          return r.submission_status === pdfStatusFilter;
        });

        if (targetedPdfRows.length === 0) {
          alert('No report criteria entries found matching your PDF selection.');
          fetchReports();
          return;
        }

        // CRITICAL FIX: Turn on printing mode layouts, swap data rows, then execute print
        setReports(targetedPdfRows);
        setIsPrinting(true); 

        setTimeout(() => {
          window.print();
          setIsPrinting(false); // Reset layout rules back to normal screen standards
          fetchReports(); 
        }, 400);
      }
    } catch (err) {
      alert('Failed to generate document metrics.');
      setIsPrinting(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      {/* REPORT SUBMISSION CARD */}
      <section className={styles.formSection}>
        <h2 style={{ marginTop: 0, marginBottom: '1.5rem' }}>Submit Daily Report</h2>
        <div className={styles.formRowGroup}>
          <form onSubmit={handleSubmit}>
            {/* Form groups remain as built previously */}
            <div className={styles.formGrid}>
              <div className={styles.formGroup}><label>Employee Name</label><input type="text" className={styles.disabledField} value={user?.name || ''} disabled /></div>
              <div className={styles.formGroup}><label>Department</label><input type="text" className={styles.disabledField} value={user?.department || 'General Operations'} disabled /></div>
              <div className={styles.formGroup}><label>Date</label><input type="date" name="date" value={formData.date} min={new Date().toISOString().split('T')[0]} max={new Date().toISOString().split('T')[0]} required className={styles.inputField} /></div>
              <div className={styles.formGroup}><label>Task / Project Name</label><input type="text" name="project_name" value={formData.project_name} onChange={handleChange} required className={styles.inputField} placeholder="e.g. CoreHR Authentication" /></div>
              <div className={styles.formGroup}>
                <label>Work Status</label>
                <select name="work_status" value={formData.work_status} onChange={handleChange} className={styles.selectField}>
                  <option value="Completed">Completed</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Delayed">Delayed</option>
                  <option value="On Hold">On Hold</option>
                </select>
              </div>
              <div className={styles.formGroup}><label>Start Time</label><input type="time" name="start_time" value={formData.start_time} onChange={handleChange} required className={styles.inputField} /></div>
              <div className={styles.formGroup}><label>End Time</label><input type="time" name="end_time" value={formData.end_time} onChange={handleChange} required className={styles.inputField} /></div>
              <div className={`${styles.formGroup} ${styles.fullWidth}`}><label>Remarks / Notes</label><textarea name="remarks" value={formData.remarks} onChange={handleChange} className={styles.inputField} style={{ minHeight: '60px' }} placeholder="Detail specific items completed..." /></div>
            </div>
            <button type="submit" className={styles.submitBtn}>Submit Report</button>
          </form>
        </div>
      </section>

      {/* TRACKER & EXPORT CONTROL INTERFACE MODULE */}
      <section className={styles.logsSection}>
        <h3 style={{ marginTop: 0, marginBottom: '1.25rem' }}>
          {isHRView ? 'Team Attendance & Report Status' : 'My Work Logs History'}
        </h3>

        {/* NEW: ADVANCED PDF EXPORT CONFIGURATION PANEL (HR Eye-Level View Only) */}
        {isHRView && (
          <div className={styles.pdfControlBox}>
            <div className={styles.filterGroup}>
              <label>📅 PDF Time Scope:</label>
              <select value={pdfTimeMode} onChange={e => setPdfTimeMode(e.target.value)} className={styles.filterSelect}>
                <option value="SpecificDay">Specific Single Day</option>
                <option value="MonthView">Entire Month</option>
              </select>
            </div>

            {pdfTimeMode === 'SpecificDay' ? (
              <div className={styles.filterGroup}>
                <label>Target Day:</label>
                <input type="date" value={pdfSelectedDate} onChange={e => setPdfSelectedDate(e.target.value)} className={styles.filterDateInput} />
              </div>
            ) : (
              <div className={styles.filterGroup}>
                <label>Target Month:</label>
                <input type="month" value={pdfSelectedMonth} onChange={e => setPdfSelectedMonth(e.target.value)} className={styles.filterDateInput} />
              </div>
            )}

            <div className={styles.filterGroup}>
              <label> Report Filters:</label>
              <select value={pdfStatusFilter} onChange={e => setPdfStatusFilter(e.target.value)} className={styles.filterSelect}>
                <option value="All">All Statuses</option>
                <option value="Submitted">Completed </option>
                <option value="Pending">Pending </option>
              </select>
            </div>

            <button onClick={triggerPDFDownload} className={styles.pdfBtn}>
              📄 Download PDF Report
            </button>
          </div>
        )}

        {/* SCREEN METRIC FILTERS */}
        {isHRView && (
          <div className={styles.filterControlBar}>
            <div className={styles.filterGroup}>
              <label>🖥️ Screen View Date:</label>
              <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className={styles.filterDateInput} />
            </div>
            <div className={styles.filterGroup}>
              <label>Daily Status:</label>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={styles.filterSelect}>
                <option value="All">All Employees</option>
                <option value="Submitted">Submitted Reports</option>
                <option value="Pending">Pending / Missing</option>
              </select>
            </div>
          </div>
        )}

        {/* REPORTS RECORD DATA GRID TABLE */}
        {loading ? (
          <p>Processing request data streams...</p>
        ) : filteredReports.length === 0 ? (
          <p style={{ color: '#666', fontStyle: 'italic', padding: '1rem 0' }}>No records match the active layout view.</p>
        ) : (
          <div className={styles.tableScrollWrapper}>
            <div style={{ overflowX: 'auto' }}>
              <table className="employeeTable" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#f4f4f4', borderBottom: '2px solid #ddd' }}>
                    <th style={{ padding: '12px 10px', textAlign: 'left' }}>Date</th>
                    <th style={{ padding: '12px 10px' }}>Employee</th>
                    <th style={{ padding: '12px 10px' }}>Department</th>
                    <th style={{ padding: '12px 10px' }}>Daily Status</th>
                    <th style={{ padding: '12px 10px' }}>Project/Task</th>
                    <th style={{ padding: '12px 10px' }}>Work Status</th>
                    <th style={{ padding: '12px 10px' }}>Duration</th>
                    <th style={{ padding: '12px 10px' }}>Remarks / Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const isHRView = user?.role === 'hr' || user?.role === 'manager';
                    const showFullDetails = isHRView || isPrinting;

                    // 1. STANDARD SINGLE-DAY OR USER VIEW LAYOUT
                    if (!isHRView || pdfTimeMode !== 'MonthView') {
                      return filteredReports.map((r, index) => {
                        // FIX: Safely determine submission if submission_status is explicit OR if valid report fields exist
                        const hasSubmitted = r.submission_status === 'Submitted' || !!r.project_name || !!r.id;
                        // Format date cleanly to DD-MM-YYYY or ISO format
                        const rawDate = r.report_date || r.date;
                        const formattedDate = rawDate 
                          ? new Date(rawDate).toLocaleDateString('en-GB') // Outputs DD/MM/YYYY
                          : '—';
                        
                        return (
                          <tr key={index} style={{ borderBottom: '1px solid #eee', opacity: hasSubmitted ? 1 : 0.75 }}>
                            <td style={{ padding: '12px 10px', fontWeight: '600', color: '#374151' }}>
                              {formattedDate}
                            </td>
                            
                            <td style={{ padding: '12px 10px' }}>
                              <strong>{r.employee_name || user?.name}</strong>
                            </td>
                            <td style={{ padding: '12px 10px' }}>{r.department_name || user?.department || 'Unassigned'}</td>
                            
                            {/* 1. Daily Status Column */}
                            <td style={{ padding: '12px 10px' }}>
                              <span style={{
                                display: 'inline-block', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700',
                                backgroundColor: hasSubmitted ? '#d1fae5' : '#fee2e2',
                                color: hasSubmitted ? '#065f46' : '#991b1b'
                              }}>
                                {hasSubmitted ? 'Submitted' : 'Pending'}
                              </span>
                            </td>

                            {/* 2. Project / Task Column */}
                            <td style={{ padding: '12px 10px' }}>
                              {hasSubmitted ? r.project_name : <span style={{ color: '#aaa', fontStyle: 'italic' }}>— Not Started —</span>}
                            </td>

                            {/* 3. Work Status Badge Column */}
                            <td style={{ padding: '12px 10px' }}>
                              {hasSubmitted && r.work_status ? (
                                <span style={{
                                  display: 'inline-block', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold',
                                  backgroundColor: r.work_status === 'Completed' ? '#e6f4ea' : '#ffe7d9',
                                  color: r.work_status === 'Completed' ? '#137333' : '#b06000'
                                }}>{r.work_status}</span>
                              ) : '—'}
                            </td>

                            {/* 4. Duration Column */}
                            <td style={{ padding: '12px 10px' }}>
                              {hasSubmitted && r.start_time ? <code>{r.start_time.substring(0, 5)} - {r.end_time.substring(0, 5)}</code> : '—'}
                            </td>

                            {/* 5. Remarks / Notes Column */}
                            <td style={{ padding: '12px 10px', color: '#555', maxWidth: '250px', wordBreak: 'break-word' }}>
                              {hasSubmitted ? (r.remarks || 'None') : '—'}
                            </td>
                          </tr>
                        );
                      });
                    }

                    // 2. ADVANCED ENTIRE MONTH CALENDAR VIEW: Client-side grouping by target dates
                    const groups = {};
                    filteredReports.forEach((r) => {
                      const dateStr = r.date ? new Date(r.date).toLocaleDateString(undefined, { timeZone: 'UTC' }) : 'Unknown Date';
                      if (!groups[dateStr]) groups[dateStr] = [];
                      groups[dateStr].push(r);
                    });

                    // 3. Render elements day-by-day with high-contrast grouping layout rows
                    return Object.keys(groups).map((dateKey) => (
                      <tr key={dateKey} style={{ display: 'contents' }}>
                        {/* Full-width Date Section Header Separator Banner */}
                        <tr>
                          <td colSpan="7" style={{
                            background: '#e5e7eb',
                            padding: '10px 12px',
                            fontWeight: 'bold',
                            color: '#111827',
                            fontSize: '0.85rem',
                            borderBottom: '1px solid #d1d5db'
                          }}>
                            📅 Date: {dateKey}
                          </td>
                        </tr>
                        
                        {/* Populate child lines mapping to employees tracked inside this specific date */}
                        {groups[dateKey].map((r, idx) => {
                          const hasSubmitted = r.submission_status === 'Submitted';
                          return (
                            <tr key={`row-${dateKey}-${idx}`} style={{ borderBottom: '1px solid #eee', opacity: hasSubmitted ? 1 : 0.75 }}>
                              <td style={{ padding: '12px 10px', paddingLeft: '20px' }}>
                                <strong>{r.employee_name}</strong>
                              </td>
                              <td style={{ padding: '12px 10px' }}>{r.department_name || 'Unassigned'}</td>
                              
                              {/* 1. Daily Status Column */}
                              <td style={{ padding: '12px 10px' }}>
                                <span style={{
                                  display: 'inline-block', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700',
                                  backgroundColor: hasSubmitted ? '#d1fae5' : '#fee2e2',
                                  color: hasSubmitted ? '#065f46' : '#991b1b'
                                }}>
                                  {r.submission_status || 'Pending'}
                                </span>
                              </td>

                              {/* 2. Project / Task Column */}
                              <td style={{ padding: '12px 10px' }}>
                                {hasSubmitted ? r.project_name : <span style={{ color: '#aaa', fontStyle: 'italic' }}>— Not Started —</span>}
                              </td>

                              {/* 3. Work Status Badge Column */}
                              <td style={{ padding: '12px 10px' }}>
                                {hasSubmitted ? (
                                  <span style={{
                                    display: 'inline-block', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold',
                                    backgroundColor: r.work_status === 'Completed' ? '#e6f4ea' : '#ffe7d9',
                                    color: r.work_status === 'Completed' ? '#137333' : '#b06000'
                                  }}>{r.work_status}</span>
                                ) : '—'}
                              </td>

                              {/* 4. Duration Column */}
                              <td style={{ padding: '12px 10px' }}>
                                {hasSubmitted && r.start_time ? <code>{r.start_time.substring(0, 5)} - {r.end_time.substring(0, 5)}</code> : '—'}
                              </td>

                              {/* 5. Remarks / Notes Column */}
                              <td style={{ padding: '12px 10px', color: '#555', maxWidth: '250px', wordBreak: 'break-word' }}>
                                {hasSubmitted ? (r.remarks || 'None') : '—'}
                              </td>
                            </tr>
                          );
                        })}
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}