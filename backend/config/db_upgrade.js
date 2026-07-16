import pool from './db.js';
import bcrypt from 'bcryptjs';

export async function upgradeDatabase() {
  console.log('Nyaya Setu: Running database upgrade checks...');
  let connection;
  try {
    connection = await pool.getConnection();

    // Modify users role enum constraint to VARCHAR to support verification officer and admin roles
    await connection.query('ALTER TABLE users MODIFY COLUMN role VARCHAR(50) NOT NULL');
    console.log('- Altered users role column constraint to VARCHAR.');

    // Seed verification officer
    const [officers] = await connection.query("SELECT id FROM users WHERE email = 'verification@nyayasetu.in'");
    if (officers.length === 0) {
      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync('password123', salt);
      await connection.query(
        "INSERT INTO users (name, email, password_hash, role, phone) VALUES (?, ?, ?, ?, ?)",
        ['Nyaya Verification Officer', 'verification@nyayasetu.in', hash, 'verification_officer', '9999911111']
      );
      console.log('- Seeded Verification Officer default credentials.');
    }

    // Seed custom verification officer account requested: ndhivija3@gmail.com / ndhivijia@2038
    const [officersSpecific] = await connection.query("SELECT id FROM users WHERE email = 'ndhivija3@gmail.com'");
    if (officersSpecific.length === 0) {
      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync('ndhivijia@2038', salt);
      await connection.query(
        "INSERT INTO users (name, email, password_hash, role, phone) VALUES (?, ?, ?, ?, ?)",
        ['Officer Dhivija', 'ndhivija3@gmail.com', hash, 'verification_officer', '9876543211']
      );
      console.log('- Seeded Custom Verification Officer (ndhivija3@gmail.com) credentials.');
    }

    // Seed super admin
    const [admins] = await connection.query("SELECT id FROM users WHERE email = 'admin@nyayasetu.in'");
    if (admins.length === 0) {
      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync('password123', salt);
      await connection.query(
        "INSERT INTO users (name, email, password_hash, role, phone) VALUES (?, ?, ?, ?, ?)",
        ['System Super Admin', 'admin@nyayasetu.in', hash, 'super_admin', '9999922222']
      );
      console.log('- Seeded Super Admin default credentials.');
    }

    // 1. Check users table columns
    const [userColumns] = await connection.query('SHOW COLUMNS FROM users');
    const userColNames = userColumns.map(c => c.Field.toLowerCase());

    if (!userColNames.includes('state')) {
      await connection.query('ALTER TABLE users ADD COLUMN state VARCHAR(100) DEFAULT NULL');
      console.log('- Added column "state" to "users" table.');
    }
    if (!userColNames.includes('district')) {
      await connection.query('ALTER TABLE users ADD COLUMN district VARCHAR(100) DEFAULT NULL');
      console.log('- Added column "district" to "users" table.');
    }
    if (!userColNames.includes('city')) {
      await connection.query('ALTER TABLE users ADD COLUMN city VARCHAR(100) DEFAULT NULL');
      console.log('- Added column "city" to "users" table.');
    }

    // 2. Check advocates table columns
    const [advColumns] = await connection.query('SHOW COLUMNS FROM advocates');
    const advColNames = advColumns.map(c => c.Field.toLowerCase());

    if (!advColNames.includes('state')) {
      await connection.query('ALTER TABLE advocates ADD COLUMN state VARCHAR(100) DEFAULT NULL');
      console.log('- Added column "state" to "advocates" table.');
    }
    if (!advColNames.includes('district')) {
      await connection.query('ALTER TABLE advocates ADD COLUMN district VARCHAR(100) DEFAULT NULL');
      console.log('- Added column "district" to "advocates" table.');
    }
    if (!advColNames.includes('city')) {
      await connection.query('ALTER TABLE advocates ADD COLUMN city VARCHAR(100) DEFAULT NULL');
      console.log('- Added column "city" to "advocates" table.');
    }
    if (!advColNames.includes('office_address')) {
      await connection.query('ALTER TABLE advocates ADD COLUMN office_address TEXT DEFAULT NULL');
      console.log('- Added column "office_address" to "advocates" table.');
    }
    if (!advColNames.includes('enrollment_certificate')) {
      await connection.query('ALTER TABLE advocates ADD COLUMN enrollment_certificate VARCHAR(255) DEFAULT NULL');
      console.log('- Added column "enrollment_certificate" to "advocates" table.');
    }
    if (!advColNames.includes('id_card')) {
      await connection.query('ALTER TABLE advocates ADD COLUMN id_card VARCHAR(255) DEFAULT NULL');
      console.log('- Added column "id_card" to "advocates" table.');
    }
    if (!advColNames.includes('gov_id')) {
      await connection.query('ALTER TABLE advocates ADD COLUMN gov_id VARCHAR(255) DEFAULT NULL');
      console.log('- Added column "gov_id" to "advocates" table.');
    }
    if (!advColNames.includes('practice_certificate')) {
      await connection.query('ALTER TABLE advocates ADD COLUMN practice_certificate VARCHAR(255) DEFAULT NULL');
      console.log('- Added column "practice_certificate" to "advocates" table.');
    }
    if (!advColNames.includes('verification_status')) {
      await connection.query("ALTER TABLE advocates ADD COLUMN verification_status VARCHAR(50) DEFAULT 'Pending Verification'");
      console.log('- Added column "verification_status" to "advocates" table.');
    }
    if (!advColNames.includes('live_selfie')) {
      await connection.query('ALTER TABLE advocates ADD COLUMN live_selfie LONGTEXT DEFAULT NULL');
      console.log('- Added column "live_selfie" to "advocates" table.');
    } else {
      await connection.query('ALTER TABLE advocates MODIFY COLUMN live_selfie LONGTEXT DEFAULT NULL');
      console.log('- Ensured "live_selfie" column is LONGTEXT.');
    }
    if (!advColNames.includes('ocr_name')) {
      await connection.query('ALTER TABLE advocates ADD COLUMN ocr_name VARCHAR(100) DEFAULT NULL');
      console.log('- Added column "ocr_name" to "advocates" table.');
    }
    if (!advColNames.includes('ocr_enrollment')) {
      await connection.query('ALTER TABLE advocates ADD COLUMN ocr_enrollment VARCHAR(100) DEFAULT NULL');
      console.log('- Added column "ocr_enrollment" to "advocates" table.');
    }
    if (!advColNames.includes('ocr_certificate_no')) {
      await connection.query('ALTER TABLE advocates ADD COLUMN ocr_certificate_no VARCHAR(100) DEFAULT NULL');
      console.log('- Added column "ocr_certificate_no" to "advocates" table.');
    }
    if (!advColNames.includes('ai_match_score')) {
      await connection.query('ALTER TABLE advocates ADD COLUMN ai_match_score INT DEFAULT NULL');
      console.log('- Added column "ai_match_score" to "advocates" table.');
    }
    if (!advColNames.includes('face_match_score')) {
      await connection.query('ALTER TABLE advocates ADD COLUMN face_match_score INT DEFAULT NULL');
      console.log('- Added column "face_match_score" to "advocates" table.');
    }
    if (!advColNames.includes('name_match')) {
      await connection.query('ALTER TABLE advocates ADD COLUMN name_match BOOLEAN DEFAULT NULL');
      console.log('- Added column "name_match" to "advocates" table.');
    }
    if (!advColNames.includes('duplicate_detection')) {
      await connection.query('ALTER TABLE advocates ADD COLUMN duplicate_detection VARCHAR(255) DEFAULT NULL');
      console.log('- Added column "duplicate_detection" to "advocates" table.');
    }
    if (!advColNames.includes('ai_verification_report')) {
      await connection.query('ALTER TABLE advocates ADD COLUMN ai_verification_report TEXT DEFAULT NULL');
      console.log('- Added column "ai_verification_report" to "advocates" table.');
    }
    if (!advColNames.includes('verification_notes')) {
      await connection.query('ALTER TABLE advocates ADD COLUMN verification_notes TEXT DEFAULT NULL');
      console.log('- Added column "verification_notes" to "advocates" table.');
    }
    if (!advColNames.includes('reject_reason')) {
      await connection.query('ALTER TABLE advocates ADD COLUMN reject_reason TEXT DEFAULT NULL');
      console.log('- Added column "reject_reason" to "advocates" table.');
    }
    if (!advColNames.includes('verification_history')) {
      await connection.query('ALTER TABLE advocates ADD COLUMN verification_history TEXT DEFAULT NULL');
      console.log('- Added column "verification_history" to "advocates" table.');
    }
    if (!advColNames.includes('alternate_phone')) {
      await connection.query('ALTER TABLE advocates ADD COLUMN alternate_phone VARCHAR(20) DEFAULT NULL');
      console.log('- Added column "alternate_phone" to "advocates" table.');
    }
    if (!advColNames.includes('address')) {
      await connection.query('ALTER TABLE advocates ADD COLUMN address TEXT DEFAULT NULL');
      console.log('- Added column "address" to "advocates" table.');
    }
    if (!advColNames.includes('pincode')) {
      await connection.query('ALTER TABLE advocates ADD COLUMN pincode VARCHAR(10) DEFAULT NULL');
      console.log('- Added column "pincode" to "advocates" table.');
    }
    if (!advColNames.includes('online_consultation_fee')) {
      await connection.query('ALTER TABLE advocates ADD COLUMN online_consultation_fee DECIMAL(10,2) DEFAULT 0.00');
      console.log('- Added column "online_consultation_fee" to "advocates" table.');
    }
    if (!advColNames.includes('working_days')) {
      await connection.query('ALTER TABLE advocates ADD COLUMN working_days VARCHAR(255) DEFAULT NULL');
      console.log('- Added column "working_days" to "advocates" table.');
    }
    if (!advColNames.includes('working_hours')) {
      await connection.query('ALTER TABLE advocates ADD COLUMN working_hours VARCHAR(255) DEFAULT NULL');
      console.log('- Added column "working_hours" to "advocates" table.');
    }
    if (!advColNames.includes('court_locations')) {
      await connection.query('ALTER TABLE advocates ADD COLUMN court_locations TEXT DEFAULT NULL');
      console.log('- Added column "court_locations" to "advocates" table.');
    }
    if (!advColNames.includes('education')) {
      await connection.query('ALTER TABLE advocates ADD COLUMN education TEXT DEFAULT NULL');
      console.log('- Added column "education" to "advocates" table.');
    }
    if (!advColNames.includes('degrees')) {
      await connection.query('ALTER TABLE advocates ADD COLUMN degrees TEXT DEFAULT NULL');
      console.log('- Added column "degrees" to "advocates" table.');
    }
    if (!advColNames.includes('certifications')) {
      await connection.query('ALTER TABLE advocates ADD COLUMN certifications TEXT DEFAULT NULL');
      console.log('- Added column "certifications" to "advocates" table.');
    }
    if (!advColNames.includes('website')) {
      await connection.query('ALTER TABLE advocates ADD COLUMN website VARCHAR(255) DEFAULT NULL');
      console.log('- Added column "website" to "advocates" table.');
    }
    if (!advColNames.includes('linkedin')) {
      await connection.query('ALTER TABLE advocates ADD COLUMN linkedin VARCHAR(255) DEFAULT NULL');
      console.log('- Added column "linkedin" to "advocates" table.');
    }
    if (!advColNames.includes('office_name')) {
      await connection.query('ALTER TABLE advocates ADD COLUMN office_name VARCHAR(255) DEFAULT NULL');
      console.log('- Added column "office_name" to "advocates" table.');
    }

    // 3. Create advocate_specializations table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS advocate_specializations (
        advocate_id INT NOT NULL,
        specialization_id INT NOT NULL,
        PRIMARY KEY (advocate_id, specialization_id),
        FOREIGN KEY (advocate_id) REFERENCES advocates(id) ON DELETE CASCADE,
        FOREIGN KEY (specialization_id) REFERENCES legal_categories(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('- Table "advocate_specializations" verified/created.');

    // 4. Automatically migrate existing specializations to link table
    await connection.query(`
      INSERT IGNORE INTO advocate_specializations (advocate_id, specialization_id)
      SELECT id, specialization_id FROM advocates WHERE specialization_id IS NOT NULL;
    `);
    console.log('- Migrated existing single-specialization fields to advocate_specializations.');

    // 5. Create verification_requests table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS verification_requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        advocate_id INT NOT NULL,
        status VARCHAR(50) DEFAULT 'Pending Verification',
        assigned_officer_id INT DEFAULT NULL,
        notes TEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (advocate_id) REFERENCES advocates(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('- Table "verification_requests" verified/created.');

    // 6. Create selfies table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS selfies (
        id INT AUTO_INCREMENT PRIMARY KEY,
        advocate_id INT NOT NULL,
        image_data LONGTEXT NOT NULL,
        face_match_score DECIMAL(5,2) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (advocate_id) REFERENCES advocates(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('- Table "selfies" verified/created.');

    // 7. Create otp_logs table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS otp_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(100) DEFAULT NULL,
        phone VARCHAR(20) DEFAULT NULL,
        otp_code VARCHAR(10) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('- Table "otp_logs" verified/created.');

    // 8. Create verification_logs table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS verification_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        request_id INT DEFAULT NULL,
        officer_id INT DEFAULT NULL,
        action VARCHAR(50) NOT NULL,
        notes TEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('- Table "verification_logs" verified/created.');

    // 9. Check columns of documents table
    const [docColumns] = await connection.query('SHOW COLUMNS FROM documents');
    const docColNames = docColumns.map(c => c.Field.toLowerCase());
    if (!docColNames.includes('ocr_extracted_text')) {
      await connection.query('ALTER TABLE documents ADD COLUMN ocr_extracted_text TEXT DEFAULT NULL');
      console.log('- Added column "ocr_extracted_text" to "documents" table.');
    }

    // 10. Create ai_chat_history table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS ai_chat_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        message TEXT NOT NULL,
        response TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('- Table "ai_chat_history" verified/created.');

    // 11. Create profile_audit_logs table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS profile_audit_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        changed_field VARCHAR(100) NOT NULL,
        old_value TEXT NULL,
        new_value TEXT NULL,
        updated_by INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('- Table "profile_audit_logs" verified/created.');

    // 12. Check columns of appointments table
    const [apptColumns] = await connection.query('SHOW COLUMNS FROM appointments');
    const apptColNames = apptColumns.map(c => c.Field.toLowerCase());

    await connection.query("ALTER TABLE appointments MODIFY COLUMN status VARCHAR(50) DEFAULT 'pending'");
    console.log('- Altered appointments status column constraint to VARCHAR.');
    if (!apptColNames.includes('meeting_link')) {
      await connection.query('ALTER TABLE appointments ADD COLUMN meeting_link VARCHAR(255) DEFAULT NULL');
      console.log('- Added column "meeting_link" to "appointments" table.');
    }
    if (!apptColNames.includes('meeting_provider')) {
      await connection.query('ALTER TABLE appointments ADD COLUMN meeting_provider VARCHAR(50) DEFAULT NULL');
      console.log('- Added column "meeting_provider" to "appointments" table.');
    }
    if (!apptColNames.includes('meeting_status')) {
      await connection.query('ALTER TABLE appointments ADD COLUMN meeting_status VARCHAR(50) DEFAULT NULL');
      console.log('- Added column "meeting_status" to "appointments" table.');
    }
    if (!apptColNames.includes('meeting_created_at')) {
      await connection.query('ALTER TABLE appointments ADD COLUMN meeting_created_at TIMESTAMP DEFAULT NULL');
      console.log('- Added column "meeting_created_at" to "appointments" table.');
    }

    // 13. Create advocate_slots table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS advocate_slots (
        id INT AUTO_INCREMENT PRIMARY KEY,
        advocate_id INT NOT NULL,
        slot_date DATE NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        consultation_type ENUM('Video','Audio','Chat') DEFAULT 'Video',
        duration_minutes INT DEFAULT 30,
        max_bookings INT DEFAULT 1,
        repeat_type ENUM('None','Daily','Weekly') DEFAULT 'None',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (advocate_id) REFERENCES advocates(id) ON DELETE CASCADE,
        INDEX idx_slots_advocate (advocate_id),
        INDEX idx_slots_date (slot_date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('- Table "advocate_slots" verified/created.');

    // 14. Add new columns to appointments table for the approval workflow
    const [apptColumns2] = await connection.query('SHOW COLUMNS FROM appointments');
    const apptColNames2 = apptColumns2.map(c => c.Field.toLowerCase());

    if (!apptColNames2.includes('slot_id')) {
      await connection.query('ALTER TABLE appointments ADD COLUMN slot_id INT DEFAULT NULL');
      console.log('- Added column "slot_id" to "appointments" table.');
    }
    if (!apptColNames2.includes('rejection_reason')) {
      await connection.query('ALTER TABLE appointments ADD COLUMN rejection_reason TEXT DEFAULT NULL');
      console.log('- Added column "rejection_reason" to "appointments" table.');
    }
    if (!apptColNames2.includes('reschedule_slot_id')) {
      await connection.query('ALTER TABLE appointments ADD COLUMN reschedule_slot_id INT DEFAULT NULL');
      console.log('- Added column "reschedule_slot_id" to "appointments" table.');
    }
    if (!apptColNames2.includes('reschedule_status')) {
      await connection.query("ALTER TABLE appointments ADD COLUMN reschedule_status VARCHAR(50) DEFAULT NULL");
      console.log('- Added column "reschedule_status" to "appointments" table.');
    }
    if (!apptColNames2.includes('duration_minutes')) {
      await connection.query('ALTER TABLE appointments ADD COLUMN duration_minutes INT DEFAULT 30');
      console.log('- Added column "duration_minutes" to "appointments" table.');
    }
    if (!apptColNames2.includes('consultation_type')) {
      await connection.query("ALTER TABLE appointments ADD COLUMN consultation_type VARCHAR(20) DEFAULT 'Video'");
      console.log('- Added column "consultation_type" to "appointments" table.');
    }
    if (!apptColNames2.includes('reschedule_reason')) {
      await connection.query("ALTER TABLE appointments ADD COLUMN reschedule_reason TEXT DEFAULT NULL");
      console.log('- Added column "reschedule_reason" to "appointments" table.');
    }

    console.log('Nyaya Setu: Database schema check completed successfully.');
  } catch (error) {
    console.error('Nyaya Setu Database upgrade check error:', error);
  } finally {
    if (connection) connection.release();
  }
}
