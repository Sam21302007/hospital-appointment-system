import { mockAuth, mockDb } from './localStorageDb';

const API_BASE = 'https://medvault-api-xxxx.onrender.com/api'; // Replace with your actual Render URL


// Cache variable to track backend connection status
let backendOnline = false;

// Helper to check backend health
export const checkBackendStatus = async () => {
  try {
    const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(1500) });
    const data = await res.json();
    backendOnline = data.status === 'healthy';
  } catch (err) {
    backendOnline = false;
  }
  return backendOnline;
};

// Check immediately on load
checkBackendStatus();

// Helper to get auth header
const getHeaders = () => {
  const token = localStorage.getItem('medcare_jwt');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

export const apiClient = {
  isBackendConnected: () => backendOnline,

  // Auth endpoints
  login: async (email, password) => {
    const isOnline = await checkBackendStatus();
    if (!isOnline) {
      const res = mockAuth.signIn(email, password);
      return { user: res.user, token: 'mock-jwt-token' };
    }

    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Login failed');
    }
    const data = await res.json();
    localStorage.setItem('medcare_jwt', data.token);
    return data;
  },

  register: async (email, password, profileData) => {
    const isOnline = await checkBackendStatus();
    if (!isOnline) {
      const res = mockAuth.signUp(email, password, profileData);
      return { user: res.user, token: 'mock-jwt-token' };
    }

    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, ...profileData })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Registration failed');
    }
    const data = await res.json();
    localStorage.setItem('medcare_jwt', data.token);
    return data;
  },

  logout: () => {
    localStorage.removeItem('medcare_jwt');
    mockAuth.signOut();
  },

  getProfile: async () => {
    const isOnline = await checkBackendStatus();
    if (!isOnline) {
      const res = mockAuth.getSession();
      return res.data?.session?.user || null;
    }

    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: getHeaders()
      });
      if (!res.ok) {
        localStorage.removeItem('medcare_jwt');
        return null;
      }
      const data = await res.json();
      return data.user;
    } catch (err) {
      return null;
    }
  },

  getDoctors: async () => {
    const isOnline = await checkBackendStatus();
    if (!isOnline) {
      const list = mockDb.getDoctors();
      return list.map(d => ({ ...d, id: d.id || d._id }));
    }

    const res = await fetch(`${API_BASE}/auth/doctors`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch doctors list');
    const data = await res.json();
    return data.map(d => ({ ...d, id: d._id || d.id }));
  },

  getUsers: async () => {
    const isOnline = await checkBackendStatus();
    if (!isOnline) {
      const list = mockDb.getAllUsers();
      return list.map(u => ({ ...u, id: u.id || u._id }));
    }

    const res = await fetch(`${API_BASE}/auth/users`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch users list');
    const data = await res.json();
    return data.map(u => ({ ...u, id: u._id || u.id }));
  },

  // Appointments endpoints
  getAppointments: async (userId, role) => {
    const isOnline = await checkBackendStatus();
    if (!isOnline) {
      return mockDb.getAppointments(userId, role);
    }

    const res = await fetch(`${API_BASE}/appointments`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch appointments');
    return res.json();
  },

  createAppointment: async (apptData) => {
    const isOnline = await checkBackendStatus();
    if (!isOnline) {
      return mockDb.createAppointment(apptData);
    }

    const res = await fetch(`${API_BASE}/appointments`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(apptData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Failed to book appointment');
    }
    return res.json();
  },

  updateAppointmentStatus: async (apptId, status, notes = '') => {
    const isOnline = await checkBackendStatus();
    if (!isOnline) {
      return mockDb.updateAppointmentStatus(apptId, status);
    }

    const res = await fetch(`${API_BASE}/appointments/${apptId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ status, notes })
    });
    if (!res.ok) throw new Error('Failed to update appointment');
    return res.json();
  },

  // Medical Records endpoints
  getMedicalRecords: async (patientId) => {
    const isOnline = await checkBackendStatus();
    if (!isOnline) {
      return mockDb.getMedicalRecords(patientId);
    }

    const res = await fetch(`${API_BASE}/records`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch medical records');
    return res.json();
  },

  createMedicalRecord: async (recordData) => {
    const isOnline = await checkBackendStatus();
    if (!isOnline) {
      mockDb.createMedicalRecord(recordData);
      mockDb.updateAppointmentStatus(recordData.appointment_id, 'completed');
      return;
    }

    const res = await fetch(`${API_BASE}/records`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(recordData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Failed to create medical record');
    }
    return res.json();
  },

  // Availability endpoints
  getAvailability: async (doctorId) => {
    const isOnline = await checkBackendStatus();
    if (!isOnline) {
      return mockDb.getAvailability(doctorId);
    }

    const res = await fetch(`${API_BASE}/availability/${doctorId}`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch availability');
    return res.json();
  },

  updateAvailability: async (doctorId, availabilityData) => {
    const isOnline = await checkBackendStatus();
    if (!isOnline) {
      return mockDb.updateAvailability(doctorId, availabilityData);
    }

    const res = await fetch(`${API_BASE}/availability`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ availability: availabilityData })
    });
    if (!res.ok) throw new Error('Failed to update availability');
    return res.json();
  }
};
