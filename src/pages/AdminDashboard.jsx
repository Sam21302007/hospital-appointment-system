import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../api/supabaseClient';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { format, subDays } from 'date-fns';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6'];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({ patients: 0, doctors: 0, todayAppts: 0, totalAppts: 0 });
  const [allAppointments, setAllAppointments] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [weeklyData, setWeeklyData] = useState([]);
  const [statusData, setStatusData] = useState([]);
  const [priorityData, setPriorityData] = useState([]);
  const [doctorStats, setDoctorStats] = useState([]);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  useEffect(() => {
    if (!profile) return;
    fetchAll(); // eslint-disable-line react-hooks/exhaustive-deps
  }, [profile]);

  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([fetchStats(), fetchAppointments(), fetchUsers()]);
    setLoading(false);
  };

  const fetchStats = async () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const [{ count: patients }, { count: doctors }, { count: todayAppts }, { count: totalAppts }] =
      await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'patient'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'doctor'),
        supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('appointment_date', today),
        supabase.from('appointments').select('*', { count: 'exact', head: true }),
      ]);
    setStats({ patients: patients || 0, doctors: doctors || 0, todayAppts: todayAppts || 0, totalAppts: totalAppts || 0 });
  };

  const fetchAppointments = async () => {
    const { data } = await supabase
      .from('appointments')
      .select(`*, patient:profiles!appointments_patient_id_fkey(full_name), doctor:profiles!appointments_doctor_id_fkey(full_name, specialty)`)
      .order('appointment_date', { ascending: false });
    const appts = data || [];
    setAllAppointments(appts);

    // Weekly chart data (last 7 days)
    const weekly = Array.from({ length: 7 }, (_, i) => {
      const d = subDays(new Date(), 6 - i);
      const dateStr = format(d, 'yyyy-MM-dd');
      return {
        day: format(d, 'EEE'),
        count: appts.filter(a => a.appointment_date === dateStr).length,
      };
    });
    setWeeklyData(weekly);

    // Status distribution
    const statusMap = {};
    appts.forEach(a => { statusMap[a.status] = (statusMap[a.status] || 0) + 1; });
    setStatusData(Object.entries(statusMap).map(([name, value]) => ({ name, value })));

    // Priority distribution
    const priMap = {};
    appts.forEach(a => { priMap[a.priority] = (priMap[a.priority] || 0) + 1; });
    setPriorityData(Object.entries(priMap).map(([name, value]) => ({ name, value })));

    // Doctor stats
    const docMap = {};
    appts.forEach(a => {
      const name = a.doctor?.full_name || 'Unknown';
      if (!docMap[name]) docMap[name] = { name, total: 0, completed: 0, specialty: a.doctor?.specialty };
      docMap[name].total++;
      if (a.status === 'completed') docMap[name].completed++;
    });
    setDoctorStats(Object.values(docMap).sort((a, b) => b.total - a.total));
  };

  const fetchUsers = async () => {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    setAllUsers(data || []);
  };

  const handleUpdateAppt = async (id, status) => {
    const { error } = await supabase.from('appointments').update({ status }).eq('id', id);
    if (!error) { toast.success(`Appointment ${status}`); fetchAppointments(); }
  };

  const handleExportCSV = () => {
    const headers = ['Patient', 'Doctor', 'Specialty', 'Date', 'Time', 'Priority', 'Status', 'Reason'];
    const rows = allAppointments.map(a => [
      a.patient?.full_name, a.doctor?.full_name, a.doctor?.specialty,
      a.appointment_date, a.time_slot, a.priority, a.status, a.reason || '',
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c || ''}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `appointments_${format(new Date(), 'yyyy-MM-dd')}.csv`; a.click();
    toast.success('CSV exported!');
  };

  const handleSignOut = async () => { await signOut(); navigate('/'); };

  const filteredAppts = allAppointments.filter(a => {
    if (filterStatus && a.status !== filterStatus) return false;
    if (filterPriority && a.priority !== filterPriority) return false;
    return true;
  });

  const navItems = [
    { id: 'overview', icon: '📊', label: 'Overview' },
    { id: 'appointments', icon: '📅', label: 'All Appointments' },
    { id: 'users', icon: '👥', label: 'Users' },
    { id: 'analytics', icon: '📈', label: 'Analytics' },
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) {
      return (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px' }}>
          <p style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 600 }}>{label}</p>
          <p style={{ color: 'var(--primary-light)', fontSize: 13 }}>{payload[0].value} appointments</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">🏥</div>
          <div className="logo-text"><h2>MedCare</h2><span>Admin Panel</span></div>
        </div>
        <nav className="sidebar-nav">
          <div className="nav-label">Navigation</div>
          {navItems.map(item => (
            <button key={item.id} className={`nav-item ${activeTab === item.id ? 'active' : ''}`} onClick={() => setActiveTab(item.id)}>
              <span className="nav-icon">{item.icon}</span>{item.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{profile?.full_name?.[0]?.toUpperCase() || 'A'}</div>
            <div className="user-details"><h4>{profile?.full_name}</h4><p>Administrator</p></div>
          </div>
          <button className="btn btn-secondary btn-full btn-sm" onClick={handleSignOut}>🚪 Sign Out</button>
        </div>
      </aside>

      <main className="main-content">
        <div className="dashboard-header">
          <div className="header-title">
            <h1>{navItems.find(n => n.id === activeTab)?.icon} {navItems.find(n => n.id === activeTab)?.label}</h1>
            <p>{format(new Date(), 'EEEE, MMMM dd, yyyy')}</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary btn-sm" onClick={handleExportCSV}>📥 Export CSV</button>
            <span className="badge badge-emergency">🛡️ Admin</span>
          </div>
        </div>

        <div className="page-content">
          {/* OVERVIEW */}
          {activeTab === 'overview' && (
            <div>
              <div className="stats-grid">
                {[
                  { icon: '🧑', label: 'Total Patients', value: stats.patients, color: 'rgba(99,102,241,0.15)' },
                  { icon: '👨‍⚕️', label: 'Total Doctors', value: stats.doctors, color: 'rgba(6,182,212,0.15)' },
                  { icon: '📅', label: "Today's Appointments", value: stats.todayAppts, color: 'rgba(245,158,11,0.15)' },
                  { icon: '📋', label: 'Total Appointments', value: stats.totalAppts, color: 'rgba(16,185,129,0.15)' },
                ].map((s, i) => (
                  <div className="stat-card" key={i}>
                    <div className="stat-icon" style={{ background: s.color }}>{s.icon}</div>
                    <div className="stat-info"><h3>{s.value}</h3><p>{s.label}</p></div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
                <div className="card">
                  <div className="section-title" style={{ marginBottom: 20 }}>📊 Appointments This Week</div>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={weeklyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="card">
                  <div className="section-title" style={{ marginBottom: 20 }}>🥧 Status Distribution</div>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                        {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div className="card">
                  <div className="section-title" style={{ marginBottom: 20 }}>🚨 Priority Distribution</div>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={priorityData} cx="50%" cy="50%" outerRadius={80} dataKey="value">
                        {priorityData.map((entry, i) => (
                          <Cell key={i} fill={entry.name === 'emergency' ? '#ef4444' : entry.name === 'urgent' ? '#f59e0b' : '#10b981'} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }} />
                      <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="card">
                  <div className="section-title" style={{ marginBottom: 16 }}>👨‍⚕️ Doctor Performance</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {doctorStats.slice(0, 5).map((doc, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)' }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Dr. {doc.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{doc.specialty}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--primary-light)' }}>{doc.total}</div>
                          <div style={{ fontSize: 11, color: 'var(--success)' }}>{doc.completed} done</div>
                        </div>
                      </div>
                    ))}
                    {doctorStats.length === 0 && <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: 20 }}>No data yet</div>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ALL APPOINTMENTS */}
          {activeTab === 'appointments' && (
            <div>
              <div className="section-header">
                <span className="section-title">All Appointments ({filteredAppts.length})</span>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <select className="form-select" style={{ width: 'auto' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                    <option value="">All Status</option>
                    {['pending','confirmed','completed','cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <select className="form-select" style={{ width: 'auto' }} value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
                    <option value="">All Priority</option>
                    {['normal','urgent','emergency'].map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Patient</th><th>Doctor</th><th>Date</th><th>Time</th>
                      <th>Priority</th><th>Status</th><th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAppts.length === 0 ? (
                      <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No appointments found</td></tr>
                    ) : filteredAppts.map(appt => (
                      <tr key={appt.id}>
                        <td><div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{appt.patient?.full_name}</div></td>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Dr. {appt.doctor?.full_name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{appt.doctor?.specialty}</div>
                        </td>
                        <td>{format(new Date(appt.appointment_date + 'T00:00:00'), 'MMM dd, yyyy')}</td>
                        <td>{appt.time_slot}</td>
                        <td><span className={`badge badge-${appt.priority}`}>{appt.priority}</span></td>
                        <td><span className={`badge badge-${appt.status}`}>{appt.status}</span></td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            {appt.status === 'pending' && (
                              <button className="btn btn-success btn-sm" onClick={() => handleUpdateAppt(appt.id, 'confirmed')}>✅</button>
                            )}
                            {['pending', 'confirmed'].includes(appt.status) && (
                              <button className="btn btn-danger btn-sm" onClick={() => handleUpdateAppt(appt.id, 'cancelled')}>❌</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* USERS */}
          {activeTab === 'users' && (
            <div>
              <div className="tabs">
                {['all', 'patient', 'doctor', 'admin'].map(r => (
                  <button key={r} className={`tab-btn ${filterStatus === r ? 'active' : ''}`}
                    onClick={() => setFilterStatus(r === 'all' ? '' : r)}>
                    {r === 'patient' ? '🧑' : r === 'doctor' ? '👨‍⚕️' : r === 'admin' ? '🛡️' : '👥'} {r.charAt(0).toUpperCase() + r.slice(1)}
                  </button>
                ))}
              </div>
              <div className="table-container">
                <table>
                  <thead>
                    <tr><th>Name</th><th>Role</th><th>Gender</th><th>Phone</th><th>Specialty</th><th>Joined</th></tr>
                  </thead>
                  <tbody>
                    {allUsers.filter(u => !filterStatus || u.role === filterStatus).map(u => (
                      <tr key={u.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>
                              {u.full_name?.[0]?.toUpperCase()}
                            </div>
                            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{u.full_name}</span>
                          </div>
                        </td>
                        <td><span className={`badge badge-${u.role === 'admin' ? 'emergency' : u.role === 'doctor' ? 'confirmed' : 'normal'}`}>{u.role}</span></td>
                        <td style={{ textTransform: 'capitalize' }}>{u.gender || '—'}</td>
                        <td>{u.phone || '—'}</td>
                        <td>{u.specialty || '—'}</td>
                        <td>{format(new Date(u.created_at), 'MMM dd, yyyy')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ANALYTICS */}
          {activeTab === 'analytics' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="card">
                <div className="section-title" style={{ marginBottom: 20 }}>📊 Daily Appointments — Last 7 Days</div>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={weeklyData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 13 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 13 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" fill="url(#barGrad)" radius={[8, 8, 0, 0]} />
                    <defs>
                      <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" /><stop offset="100%" stopColor="#06b6d4" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div className="card">
                  <div className="section-title" style={{ marginBottom: 20 }}>Status Breakdown</div>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={statusData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                        {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="card">
                  <div className="section-title" style={{ marginBottom: 20 }}>Priority Breakdown</div>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={priorityData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                        {priorityData.map((entry, i) => (
                          <Cell key={i} fill={entry.name === 'emergency' ? '#ef4444' : entry.name === 'urgent' ? '#f59e0b' : '#10b981'} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="card">
                <div className="section-title" style={{ marginBottom: 16 }}>👨‍⚕️ Full Doctor Leaderboard</div>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr><th>Rank</th><th>Doctor</th><th>Specialty</th><th>Total</th><th>Completed</th><th>Rate</th></tr>
                    </thead>
                    <tbody>
                      {doctorStats.map((doc, i) => (
                        <tr key={i}>
                          <td style={{ fontWeight: 700, color: i === 0 ? '#f59e0b' : 'var(--text-muted)' }}>#{i + 1}</td>
                          <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Dr. {doc.name}</td>
                          <td>{doc.specialty || '—'}</td>
                          <td>{doc.total}</td>
                          <td style={{ color: 'var(--success)' }}>{doc.completed}</td>
                          <td>
                            <span className="badge badge-confirmed">
                              {doc.total ? Math.round((doc.completed / doc.total) * 100) : 0}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
