require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const appointmentRoutes = require('./routes/appointments');
const recordRoutes = require('./routes/records');
const availabilityRoutes = require('./routes/availability');

const User = require('./models/User');
const Appointment = require('./models/Appointment');
const Availability = require('./models/Availability');

const MedicalRecord = require('./models/MedicalRecord');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/medcare';

// Middleware
app.use(cors({
  origin: '*', // Allow Vercel frontend to connect
}));
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/records', recordRoutes);
app.use('/api/availability', availabilityRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

// Seed data function helper
const seedDatabase = async () => {
  try {
    const userCount = await User.countDocuments();
    if (userCount < 7) {
      console.log('🌱 Seeding initial demo accounts into MongoDB...');
      
      // Helper to create patient if not exists
      const ensurePatient = async (email, full_name, phone, gender, date_of_birth) => {
        let pat = await User.findOne({ email });
        if (!pat) {
          pat = await User.create({
            email,
            password: 'demo1234',
            full_name,
            role: 'patient',
            phone,
            gender,
            date_of_birth
          });
        }
        return pat;
      };

      const pat1 = await ensurePatient('patient@demo.com', 'Ravi Kumar', '+91 99887 76655', 'male', '1995-05-15');
      const pat2 = await ensurePatient('anita@demo.com', 'Anita Desai', '+91 99887 76656', 'female', '1992-08-22');
      const pat3 = await ensurePatient('arjun@demo.com', 'Arjun Singh', '+91 99887 76657', 'male', '1988-11-10');
      const pat4 = await ensurePatient('meena@demo.com', 'Meena Patel', '+91 99887 76658', 'female', '1984-04-05');
      const pat5 = await ensurePatient('kavita@demo.com', 'Kavita Reddy', '+91 99887 76659', 'female', '1997-09-18');

      // Helper to create doctor if not exists
      const ensureDoctor = async (email, full_name, specialty, phone, gender) => {
        let doc = await User.findOne({ email });
        if (!doc) {
          doc = await User.create({
            email,
            password: 'demo1234',
            full_name,
            role: 'doctor',
            phone,
            gender,
            specialty
          });
          const availInserts = [1, 2, 3, 4, 5].map(day => ({
            doctor_id: doc._id,
            day_of_week: day,
            start_time: '09:00',
            end_time: '17:00',
            slot_duration_minutes: 30
          }));
          await Availability.insertMany(availInserts);
        }
        return doc;
      };

      const docPriya = await ensureDoctor('doctor@demo.com', 'Priya Sharma', 'Cardiologist', '+91 98765 43210', 'female');
      const docAravind = await ensureDoctor('aravind@demo.com', 'Aravind Swamy', 'Neurologist', '+91 98765 43211', 'male');
      const docAnanya = await ensureDoctor('ananya@demo.com', 'Ananya Roy', 'Dermatologist', '+91 98765 43212', 'female');
      const docVikram = await ensureDoctor('vikram@demo.com', 'Vikram Malhotra', 'Pediatrician', '+91 98765 43213', 'male');
      const docSunita = await ensureDoctor('sunita@demo.com', 'Sunita Rao', 'Orthopedic', '+91 98765 43214', 'female');
      const docRajesh = await ensureDoctor('rajesh@demo.com', 'Rajesh Verma', 'Ophthalmologist', '+91 98765 43215', 'male');
      const docMeera = await ensureDoctor('meera@demo.com', 'Meera Nambiar', 'ENT Specialist', '+91 98765 43216', 'female');

      // Seed Admin if not exists
      let admin = await User.findOne({ email: 'admin@demo.com' });
      if (!admin) {
        await User.create({
          email: 'admin@demo.com',
          password: 'demo1234',
          full_name: 'Admin User',
          role: 'admin'
        });
      }

      // Seed Medical Records for 5 Patients if empty
      const recCount = await MedicalRecord.countDocuments();
      if (recCount === 0) {
        await MedicalRecord.create([
          {
            patient_id: pat1._id,
            doctor_id: docPriya._id,
            diagnosis: 'Primary Essential Hypertension & Sinus Tachycardia',
            prescription: '1. Amlodipine 5mg - 1 tablet daily\n2. Metoprolol 25mg - 1 tablet twice daily',
            notes: 'Patient reported recurrent morning headaches. BP was 148/92. ECG revealed sinus tachycardia.'
          },
          {
            patient_id: pat2._id,
            doctor_id: docAnanya._id,
            diagnosis: 'Acute Atopic Dermatitis & Contact Eczema',
            prescription: '1. Hydrocortisone Ointment 1% - Apply twice daily\n2. Cetirizine 10mg - 1 tablet at bedtime',
            notes: 'Erythematous pruritic lesions on forearms. Advised fragrance-free soaps and moisturizing lotion.'
          },
          {
            patient_id: pat3._id,
            doctor_id: docAravind._id,
            diagnosis: 'Chronic Migraine without Aura & Cervical Spasm',
            prescription: '1. Rizatriptan 10mg - Take at onset\n2. Naproxen 500mg - Take as needed with food',
            notes: 'Recurrent unilateral throbbing headache with photophobia. Prescribed ergonomic neck exercises.'
          },
          {
            patient_id: pat4._id,
            doctor_id: docSunita._id,
            diagnosis: 'Bilateral Knee Osteoarthritis (Grade II) & Lumbar Strain',
            prescription: '1. Glucosamine Chondroitin 1500mg - 1 daily\n2. Aceclofenac 100mg - Post meals',
            notes: 'Joint stiffness and crepitus upon climbing stairs. Prescribed quadriceps exercises and hot compress.'
          },
          {
            patient_id: pat5._id,
            doctor_id: docMeera._id,
            diagnosis: 'Acute Maxillary Sinusitis & Seasonal Allergic Rhinitis',
            prescription: '1. Amoxicillin-Clavulanate 625mg - Twice daily for 5 days\n2. Fluticasone Nasal Spray - 2 sprays daily',
            notes: 'Facial pain and purulent nasal discharge. Throat showed mild post-nasal drip erythema.'
          }
        ]);
        console.log('✅ Auto-seeded 5 detailed Patient Medical Records!');
      }

      console.log('✅ Seeding completed! Default Login Accounts:');
      console.log('   - Patients (5 Pre-configured Patients):');
      console.log('     * Ravi Kumar (patient@demo.com)');
      console.log('     * Anita Desai (anita@demo.com)');
      console.log('     * Arjun Singh (arjun@demo.com)');
      console.log('     * Meena Patel (meena@demo.com)');
      console.log('     * Kavita Reddy (kavita@demo.com)');
      console.log('   - Doctors (7 Specialists Available)');
      console.log('   - Admin (admin@demo.com)');
    }
  } catch (err) {
    console.error('❌ Seeding database failed:', err);
  }
};

// Database Connection
mongoose
  .connect(MONGODB_URI)
  .then(async () => {
    console.log(`Connected to MongoDB locally at: ${MONGODB_URI}`);
    await seedDatabase();
    
    app.listen(PORT, () => {
      console.log(`Express API Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Connection to MongoDB failed. Ensure MongoDB is running on localhost:27017.');
    console.error(err);
    
    // In case MongoDB fails, start the server anyway so health checks work and we fall back gracefully
    app.listen(PORT, () => {
      console.log(`Express API Server running on port ${PORT} (Warning: Database disconnected)`);
    });
  });
