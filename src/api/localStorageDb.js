import { format, subDays } from 'date-fns';

// Helper to generate IDs
const uuid = () => Math.random().toString(36).substring(2, 15);

// Key names
const KEYS = {
  USERS: 'medcare_users',
  APPOINTMENTS: 'medcare_appointments',
  RECORDS: 'medcare_records',
  AVAILABILITY: 'medcare_availability',
  SESSION: 'medcare_session',
};

// Initial Seed Data
const defaultDoctors = [
  {
    id: 'doc-priya',
    email: 'doctor@demo.com',
    full_name: 'Priya Sharma',
    role: 'doctor',
    phone: '+91 98765 43210',
    gender: 'female',
    specialty: 'Cardiologist',
    created_at: subDays(new Date(), 10).toISOString(),
  },
  {
    id: 'doc-aravind',
    email: 'aravind@demo.com',
    full_name: 'Aravind Swamy',
    role: 'doctor',
    phone: '+91 98765 43211',
    gender: 'male',
    specialty: 'Neurologist',
    created_at: subDays(new Date(), 9).toISOString(),
  },
  {
    id: 'doc-ananya',
    email: 'ananya@demo.com',
    full_name: 'Ananya Roy',
    role: 'doctor',
    phone: '+91 98765 43212',
    gender: 'female',
    specialty: 'Dermatologist',
    created_at: subDays(new Date(), 8).toISOString(),
  },
  {
    id: 'doc-vikram',
    email: 'vikram@demo.com',
    full_name: 'Vikram Malhotra',
    role: 'doctor',
    phone: '+91 98765 43213',
    gender: 'male',
    specialty: 'Pediatrician',
    created_at: subDays(new Date(), 7).toISOString(),
  },
  {
    id: 'doc-sunita',
    email: 'sunita@demo.com',
    full_name: 'Sunita Rao',
    role: 'doctor',
    phone: '+91 98765 43214',
    gender: 'female',
    specialty: 'Orthopedic',
    created_at: subDays(new Date(), 6).toISOString(),
  },
  {
    id: 'doc-rajesh',
    email: 'rajesh@demo.com',
    full_name: 'Rajesh Verma',
    role: 'doctor',
    phone: '+91 98765 43215',
    gender: 'male',
    specialty: 'Ophthalmologist',
    created_at: subDays(new Date(), 5).toISOString(),
  },
  {
    id: 'doc-meera',
    email: 'meera@demo.com',
    full_name: 'Meera Nambiar',
    role: 'doctor',
    phone: '+91 98765 43216',
    gender: 'female',
    specialty: 'ENT Specialist',
    created_at: subDays(new Date(), 4).toISOString(),
  },
];

const defaultPatients = [
  {
    id: 'pat-demo',
    email: 'patient@demo.com',
    full_name: 'Ravi Kumar',
    role: 'patient',
    phone: '+91 99887 76655',
    gender: 'male',
    date_of_birth: '1990-05-15',
    created_at: subDays(new Date(), 15).toISOString(),
  },
  {
    id: 'pat-2',
    email: 'arjun@demo.com',
    full_name: 'Arjun Singh',
    role: 'patient',
    phone: '+91 99887 76656',
    gender: 'male',
    date_of_birth: '1985-11-20',
    created_at: subDays(new Date(), 12).toISOString(),
  },
  {
    id: 'pat-3',
    email: 'meena@demo.com',
    full_name: 'Meena Patel',
    role: 'patient',
    phone: '+91 99887 76657',
    gender: 'female',
    date_of_birth: '1995-02-10',
    created_at: subDays(new Date(), 7).toISOString(),
  },
];

const defaultAdmins = [
  {
    id: 'admin-demo',
    email: 'admin@demo.com',
    full_name: 'Admin User',
    role: 'admin',
    created_at: subDays(new Date(), 30).toISOString(),
  },
];

const generateAppointments = () => {
  const appts = [];
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  // Today's appointments (Active queue)
  appts.push(
    {
      id: 'appt-1',
      patient_id: 'pat-demo',
      doctor_id: 'doc-priya',
      appointment_date: todayStr,
      time_slot: '09:00',
      status: 'pending',
      priority: 'emergency',
      reason: 'Severe chest pain and short breath since morning.',
      created_at: new Date().toISOString(),
    },
    {
      id: 'appt-2',
      patient_id: 'pat-3',
      doctor_id: 'doc-priya',
      appointment_date: todayStr,
      time_slot: '09:30',
      status: 'confirmed',
      priority: 'urgent',
      reason: 'Extremely high blood pressure reading.',
      created_at: subDays(new Date(), 1).toISOString(),
    },
    {
      id: 'appt-3',
      patient_id: 'pat-2',
      doctor_id: 'doc-priya',
      appointment_date: todayStr,
      time_slot: '10:00',
      status: 'confirmed',
      priority: 'normal',
      reason: 'Routine checkup for post-surgery recovery.',
      created_at: subDays(new Date(), 2).toISOString(),
    }
  );

  // Past appointments for charts (Last 7 days)
  for (let i = 1; i <= 6; i++) {
    const d = subDays(new Date(), i);
    const dStr = format(d, 'yyyy-MM-dd');
    
    // Add 2-3 completed appointments per day
    appts.push(
      {
        id: `appt-old-${i}-1`,
        patient_id: 'pat-2',
        doctor_id: 'doc-aravind',
        appointment_date: dStr,
        time_slot: '11:00',
        status: 'completed',
        priority: 'normal',
        reason: 'Migraine and headache consulting.',
        created_at: d.toISOString(),
      },
      {
        id: `appt-old-${i}-2`,
        patient_id: 'pat-3',
        doctor_id: 'doc-sanjana',
        appointment_date: dStr,
        time_slot: '14:30',
        status: 'completed',
        priority: 'urgent',
        reason: 'Child high fever checkup.',
        created_at: d.toISOString(),
      }
    );
  }

  return appts;
};

const defaultRecords = [
  {
    id: 'rec-1',
    patient_id: 'pat-demo',
    doctor_id: 'doc-priya',
    appointment_id: 'appt-old-1-1',
    diagnosis: 'Mild hypertension and arrhythmia risk.',
    prescription: 'Metoprolol 25mg once daily, Low sodium diet, Avoid caffeine.',
    notes: 'Patient should follow up in 2 weeks. Monitor resting heart rate.',
    created_at: subDays(new Date(), 1).toISOString(),
  },
];

// Initialize Database
export const initLocalStorageDb = () => {
  if (!localStorage.getItem(KEYS.USERS)) {
    const allUsers = [...defaultDoctors, ...defaultPatients, ...defaultAdmins];
    localStorage.setItem(KEYS.USERS, JSON.stringify(allUsers));
  }
  if (!localStorage.getItem(KEYS.APPOINTMENTS)) {
    localStorage.setItem(KEYS.APPOINTMENTS, JSON.stringify(generateAppointments()));
  }
  if (!localStorage.getItem(KEYS.RECORDS)) {
    localStorage.setItem(KEYS.RECORDS, JSON.stringify(defaultRecords));
  }
  if (!localStorage.getItem(KEYS.AVAILABILITY)) {
    const availability = [];
    defaultDoctors.forEach(doc => {
      for (let i = 1; i <= 5; i++) { // Mon - Fri
        availability.push({
          id: uuid(),
          doctor_id: doc.id,
          day_of_week: i,
          start_time: '09:00',
          end_time: '17:00',
          slot_duration_minutes: 30,
        });
      }
    });
    localStorage.setItem(KEYS.AVAILABILITY, JSON.stringify(availability));
  }
};

// Retrieve data safely
const getList = (key) => JSON.parse(localStorage.getItem(key) || '[]');
const saveList = (key, data) => localStorage.setItem(key, JSON.stringify(data));

// AUTH API
export const mockAuth = {
  getSession: () => {
    initLocalStorageDb();
    const sessionUser = JSON.parse(localStorage.getItem(KEYS.SESSION) || 'null');
    return { data: { session: sessionUser ? { user: sessionUser } : null } };
  },

  signIn: (email, password) => {
    initLocalStorageDb();
    const users = getList(KEYS.USERS);
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    // For local dev convenience, allow password "demo1234" for seeded accounts
    if (!user) throw new Error('User not found.');
    
    // Save session
    localStorage.setItem(KEYS.SESSION, JSON.stringify(user));
    return { user };
  },

  signUp: (email, password, profileData) => {
    initLocalStorageDb();
    const users = getList(KEYS.USERS);
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error('Email already registered.');
    }

    const newUser = {
      id: uuid(),
      email,
      ...profileData,
      created_at: new Date().toISOString(),
    };

    users.push(newUser);
    saveList(KEYS.USERS, users);
    
    // Automatically log in
    localStorage.setItem(KEYS.SESSION, JSON.stringify(newUser));
    return { user: newUser };
  },

  signOut: () => {
    localStorage.removeItem(KEYS.SESSION);
  },

  getProfile: (userId) => {
    const users = getList(KEYS.USERS);
    return users.find(u => u.id === userId) || null;
  }
};

// DATA API
export const mockDb = {
  getDoctors: () => {
    initLocalStorageDb();
    return getList(KEYS.USERS).filter(u => u.role === 'doctor');
  },

  getAppointments: (userId, role) => {
    initLocalStorageDb();
    const appts = getList(KEYS.APPOINTMENTS);
    const users = getList(KEYS.USERS);

    return appts
      .filter(a => role === 'doctor' ? a.doctor_id === userId : a.patient_id === userId)
      .map(a => ({
        ...a,
        patient: users.find(u => u.id === a.patient_id),
        doctor: users.find(u => u.id === a.doctor_id),
      }));
  },

  getMedicalRecords: (patientId) => {
    initLocalStorageDb();
    const records = getList(KEYS.RECORDS);
    const users = getList(KEYS.USERS);

    return records
      .filter(r => r.patient_id === patientId)
      .map(r => ({
        ...r,
        doctor: users.find(u => u.id === r.doctor_id),
        patient: users.find(u => u.id === r.patient_id),
      }));
  },

  createAppointment: (apptData) => {
    const appts = getList(KEYS.APPOINTMENTS);
    const newAppt = {
      id: uuid(),
      ...apptData,
      created_at: new Date().toISOString(),
    };
    appts.push(newAppt);
    saveList(KEYS.APPOINTMENTS, appts);
    return newAppt;
  },

  updateAppointmentStatus: (apptId, status) => {
    const appts = getList(KEYS.APPOINTMENTS);
    const updated = appts.map(a => a.id === apptId ? { ...a, status } : a);
    saveList(KEYS.APPOINTMENTS, updated);
  },

  createMedicalRecord: (recordData) => {
    const records = getList(KEYS.RECORDS);
    const newRec = {
      id: uuid(),
      ...recordData,
      created_at: new Date().toISOString(),
    };
    records.push(newRec);
    saveList(KEYS.RECORDS, records);
    return newRec;
  },

  // Availability
  getAvailability: (doctorId) => {
    initLocalStorageDb();
    return getList(KEYS.AVAILABILITY).filter(a => a.doctor_id === doctorId);
  },

  updateAvailability: (doctorId, availabilityData) => {
    let avail = getList(KEYS.AVAILABILITY).filter(a => a.doctor_id !== doctorId);
    const newAvail = availabilityData.map(a => ({
      id: a.id || uuid(),
      doctor_id: doctorId,
      ...a
    }));
    saveList(KEYS.AVAILABILITY, [...avail, ...newAvail]);
  },

  // Admin API
  getAllAppointments: () => {
    initLocalStorageDb();
    const appts = getList(KEYS.APPOINTMENTS);
    const users = getList(KEYS.USERS);
    return appts.map(a => ({
      ...a,
      patient: users.find(u => u.id === a.patient_id),
      doctor: users.find(u => u.id === a.doctor_id),
    }));
  },

  getAllUsers: () => {
    initLocalStorageDb();
    return getList(KEYS.USERS);
  }
};
