-- ============================================================
-- MEDCARE HOSPITAL APPOINTMENT SYSTEM — SUPABASE SQL SCHEMA
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. PROFILES TABLE (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('patient', 'doctor', 'admin')),
  phone TEXT,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  specialty TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. APPOINTMENTS TABLE
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  appointment_date DATE NOT NULL,
  time_slot TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('normal', 'urgent', 'emergency')),
  reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. MEDICAL RECORDS TABLE
CREATE TABLE IF NOT EXISTS medical_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  diagnosis TEXT NOT NULL,
  prescription TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. DOCTOR AVAILABILITY TABLE
CREATE TABLE IF NOT EXISTS doctor_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL DEFAULT '09:00',
  end_time TIME NOT NULL DEFAULT '17:00',
  slot_duration_minutes INT NOT NULL DEFAULT 30,
  UNIQUE(doctor_id, day_of_week)
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_availability ENABLE ROW LEVEL SECURITY;

-- PROFILES: users can read all profiles, but only update their own
CREATE POLICY "Public profiles are viewable" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- APPOINTMENTS: patients/doctors can see their own; allow inserts for authenticated users
CREATE POLICY "Users can view their appointments" ON appointments FOR SELECT
  USING (auth.uid() = patient_id OR auth.uid() = doctor_id);
CREATE POLICY "Admins can view all appointments" ON appointments FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Patients can create appointments" ON appointments FOR INSERT
  WITH CHECK (auth.uid() = patient_id);
CREATE POLICY "Doctors and admins can update appointments" ON appointments FOR UPDATE
  USING (auth.uid() = doctor_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- MEDICAL RECORDS
CREATE POLICY "Patients can view their medical records" ON medical_records FOR SELECT
  USING (auth.uid() = patient_id OR auth.uid() = doctor_id);
CREATE POLICY "Admins can view all medical records" ON medical_records FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Doctors can insert medical records" ON medical_records FOR INSERT
  WITH CHECK (auth.uid() = doctor_id);

-- DOCTOR AVAILABILITY
CREATE POLICY "Anyone can view availability" ON doctor_availability FOR SELECT USING (true);
CREATE POLICY "Doctors can manage own availability" ON doctor_availability FOR ALL
  USING (auth.uid() = doctor_id);

-- ============================================================
-- DEMO SEED DATA (Optional — for quick testing)
-- Run AFTER creating demo accounts via the app's Register page
-- ============================================================
-- INSERT INTO profiles (id, full_name, role, specialty) VALUES
--   ('PASTE_PATIENT_UUID', 'Demo Patient', 'patient', NULL),
--   ('PASTE_DOCTOR_UUID', 'Dr. Demo Doctor', 'doctor', 'General Physician'),
--   ('PASTE_ADMIN_UUID', 'Admin User', 'admin', NULL);
