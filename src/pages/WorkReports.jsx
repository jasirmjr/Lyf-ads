import { useEffect, useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import styles from './styles/WorkReports.module.css';

export default function WorkReports({ user }) {

  const isAdmin = user?.role === 'hr' || user?.role === 'manager' || user?.role === 'Admin' || user?.role === 'HR';

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

  // NEW: Advanced PDF Generation Engine using jsPDF
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

        // Generate PDF using jsPDF
        const doc = new jsPDF();
        
        // Calculate statistics
        const totalEmployees = targetedPdfRows.length;
        const submittedCount = targetedPdfRows.filter(r => 
          r.submission_status === 'Submitted' || !!r.project_name || !!r.id
        ).length;
        const pendingCount = totalEmployees - submittedCount;
        const absentCount = targetedPdfRows.filter(r => r.work_status === 'Absent').length;
        
        // Add colored header box
        doc.setFillColor(66, 139, 202);
        doc.rect(0, 0, 210, 45, 'F');
        
        // Add title
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text('LYF ADS', 14, 20);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'normal');
        doc.text('Team Attendance & Report Status', 14, 30);
        
        // Add date info in white
        doc.setFontSize(10);
        const dateInfo = pdfTimeMode === 'SpecificDay' 
          ? `Date: ${pdfSelectedDate}` 
          : `Month: ${pdfSelectedMonth}`;
        doc.text(dateInfo, 14, 40);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 120, 40);
        
        // Reset text color
        doc.setTextColor(0, 0, 0);
        
        // Add summary statistics box
        doc.setFillColor(245, 245, 245);
        doc.roundedRect(14, 52, 182, 25, 3, 3, 'F');
        
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('Summary Statistics', 20, 60);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`Total Employees: ${totalEmployees}`, 20, 68);
        doc.text(`Submitted: ${submittedCount}`, 80, 68);
        doc.text(`Pending: ${pendingCount}`, 130, 68);
        doc.text(`Absent: ${absentCount}`, 170, 68);
        
        // Add colored badges for statistics
        doc.setFillColor(40, 167, 69);
        doc.circle(75, 67.5, 2, 'F');
        doc.setFillColor(255, 193, 7);
        doc.circle(125, 67.5, 2, 'F');
        doc.setFillColor(220, 53, 69);
        doc.circle(165, 67.5, 2, 'F');

        // Prepare table data with status colors
        const tableData = targetedPdfRows.map(row => {
          const rawDate = row.report_date || row.date;
          const formattedDate = rawDate 
            ? new Date(rawDate).toLocaleDateString('en-GB')
            : '—';
          const hasSubmitted = row.submission_status === 'Submitted' || !!row.project_name || !!row.id;
          const isAbsent = row.work_status === 'Absent';
          
          return [
            formattedDate,
            row.employee_name || user?.name,
            row.department_name || user?.department || 'Unassigned',
            isAbsent ? 'Absent' : (hasSubmitted ? 'Submitted' : 'Pending'),
            hasSubmitted ? row.project_name : '— Not Started —',
            hasSubmitted && row.work_status ? row.work_status : '—',
            hasSubmitted && row.start_time && row.end_time 
              ? `${row.start_time.substring(0, 5)} - ${row.end_time.substring(0, 5)}` 
              : '—',
            hasSubmitted ? (row.remarks || 'None') : '—'
          ];
        });

        // Add table with enhanced styling
        autoTable(doc, {
          startY: 85,
          head: [['Date', 'Employee', 'Department', 'Status', 'Project/Task', 'Work Status', 'Duration', 'Remarks']],
          body: tableData,
          styles: { fontSize: 8, cellPadding: 3 },
          headStyles: { 
            fillColor: [66, 139, 202], 
            textColor: 255, 
            fontStyle: 'bold',
            halign: 'center'
          },
          columnStyles: {
            0: { cellWidth: 18, halign: 'center' }, // Date
            1: { cellWidth: 28 }, // Employee
            2: { cellWidth: 25 }, // Department
            3: { cellWidth: 18, halign: 'center' }, // Status
            4: { cellWidth: 28 }, // Project/Task
            5: { cellWidth: 20, halign: 'center' }, // Work Status
            6: { cellWidth: 25, halign: 'center' }, // Duration
            7: { cellWidth: 35 }  // Remarks
          },
          didParseCell: function(data) {
            // Add color coding to status column
            if (data.section === 'body' && data.column.index === 3) {
              const status = data.cell.raw;
              if (status === 'Submitted') {
                data.cell.styles.textColor = [40, 167, 69];
                data.cell.styles.fontStyle = 'bold';
              } else if (status === 'Absent') {
                data.cell.styles.textColor = [220, 53, 69];
                data.cell.styles.fontStyle = 'bold';
              } else {
                data.cell.styles.textColor = [255, 193, 7];
                data.cell.styles.fontStyle = 'bold';
              }
            }
          },
          alternateRowStyles: { fillColor: [248, 249, 250] },
          theme: 'grid'
        });

        // Save PDF
        const fileName = pdfTimeMode === 'SpecificDay'
          ? `LYF-ADS-Report-${pdfSelectedDate}.pdf`
          : `LYF-ADS-Report-${pdfSelectedMonth}.pdf`;
        doc.save(fileName);
      }
    } catch (err) {
      console.error('PDF Generation Error:', err);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setLoading(false);
    }
  };

// Manualy admin mark if they absent
const handleMarkAbsent = async (employeeId, reportDate) => {
  // Get valid YYYY-MM-DD date string
  const targetDate = reportDate && reportDate !== '—' 
    ? reportDate 
    : (typeof screenViewDate !== 'undefined' && screenViewDate ? screenViewDate : new Date().toISOString().split('T')[0]);

  if (!employeeId) {
    alert("Employee ID is missing.");
    return;
  }

  if (!window.confirm(`Are you sure you want to mark this employee as Absent for ${targetDate}?`)) {
    return;
  }

  try {
    const res = await fetch('/api/reports/mark-absent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        employee_id: employeeId,
        date: targetDate
      })
    });

    const json = await res.json();
    if (json.status === 'success') {
      alert('Employee status updated to Absent successfully!');
      if (typeof fetchReports === 'function') {
        fetchReports();
      } else {
        window.location.reload();
      }
    } else {
      alert(json.details || json.error || 'Failed to update status.');
    }
  } catch (err) {
    console.error("Mark Absent Error:", err);
    alert('Server communication error.');
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
              <input 
                type="text" 
                value={user?.name || ''} 
                className={styles.disabledField} 
                readOnly /* 👈 Added readOnly attribute */
              />
              <div className={styles.formGroup}><label>Department</label><input type="text" className={styles.disabledField} readOnly value={user?.department || 'General Operations'} disabled /></div>
              <div className={styles.formGroup}><label>Date</label><input type="date" name="date" value={formData.date} min={new Date().toISOString().split('T')[0]} max={new Date().toISOString().split('T')[0]} required className={styles.inputField} /></div>
              <div className={styles.formGroup}><label>Task / Project Name</label><input type="text" name="project_name" value={formData.project_name} onChange={handleChange} required className={styles.inputField} placeholder="eg. Whate Done Today" /></div>
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
                 {/* <input type="month" value={pdfSelectedMonth} onChange={e => setPdfSelectedMonth(e.target.value)} className={styles.filterDateInput} /> */}
                <input 
                  type="month" 
                  value={selectedDate || ''} 
                  onChange={(e) => setSelectedDate(e.target.value)} 
                  className={styles.inputField} 
                />
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

                            {/* Daily Status Column */}
                            <td style={{ padding: '12px 10px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                
                                {/* Badge Rendering */}
                                <span style={{
                                  display: 'inline-block', 
                                  padding: '4px 10px', 
                                  borderRadius: '20px', 
                                  fontSize: '0.75rem', 
                                  fontWeight: '700',
                                  backgroundColor: 
                                    r.submission_status === 'Submitted' ? '#d1fae5' :
                                    r.submission_status === 'Absent' ? '#fee2e2' : '#fef3c7',
                                  color: 
                                    r.submission_status === 'Submitted' ? '#065f46' :
                                    r.submission_status === 'Absent' ? '#991b1b' : '#92400e'
                                }}>
                                  {r.submission_status || (r.id ? 'Submitted' : 'Pending')}
                                </span>

                                {/* Admin "Mark Absent" Action Button for Pending Entries */}
                                {isAdmin && (r.submission_status === 'Pending' || !r.submission_status) && (
                                  <button
                                    onClick={() => handleMarkAbsent(r.employee_id || r.id, r.report_date)}
                                    style={{
                                      background: '#fee2e2',
                                      color: '#991b1b',
                                      border: '1px solid #fca5a5',
                                      borderRadius: '6px',
                                      padding: '2px 8px',
                                      fontSize: '0.7rem',
                                      fontWeight: '700',
                                      cursor: 'pointer',
                                      marginLeft: '6px'
                                    }}
                                  >
                                    Mark Absent
                                  </button>
                                )}

                              </div>
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