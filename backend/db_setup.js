import pool from './config/db.js';
import bcrypt from 'bcryptjs';

async function setupDatabase() {
  console.log('Starting Nyaya Setu database setup...');
  let connection;
  try {
    connection = await pool.getConnection();
    console.log('Connected to MySQL successfully.');

    // 1. Create users table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role ENUM('client', 'advocate') NOT NULL,
        phone VARCHAR(20) DEFAULT NULL,
        language_preference ENUM('en', 'te', 'hi') DEFAULT 'en',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_users_email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('- Table "users" verified/created.');

    // 2. Create legal_categories table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS legal_categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT DEFAULT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('- Table "legal_categories" verified/created.');

    // 3. Create advocates table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS advocates (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        bar_registration VARCHAR(100) NOT NULL UNIQUE,
        specialization_id INT DEFAULT NULL,
        experience_years INT NOT NULL DEFAULT 0,
        languages VARCHAR(255) DEFAULT 'English',
        biography TEXT DEFAULT NULL,
        consultation_fee DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        location VARCHAR(100) NOT NULL,
        rating DECIMAL(3, 2) DEFAULT 5.00,
        profile_photo VARCHAR(255) DEFAULT NULL,
        is_verified BOOLEAN DEFAULT TRUE,
        availability VARCHAR(255) DEFAULT 'Available Tomorrow',
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (specialization_id) REFERENCES legal_categories(id) ON DELETE SET NULL,
        INDEX idx_advocates_specialization (specialization_id),
        INDEX idx_advocates_location (location)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('- Table "advocates" verified/created.');

    // 4. Create appointments table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS appointments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        client_id INT NOT NULL,
        advocate_id INT NOT NULL,
        appointment_date DATETIME NOT NULL,
        status ENUM('pending', 'scheduled', 'completed', 'cancelled') DEFAULT 'pending',
        notes TEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (advocate_id) REFERENCES advocates(id) ON DELETE CASCADE,
        INDEX idx_appointments_client (client_id),
        INDEX idx_appointments_advocate (advocate_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('- Table "appointments" verified/created.');

    // 5. Create cases table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS cases (
        id INT AUTO_INCREMENT PRIMARY KEY,
        client_id INT NOT NULL,
        advocate_id INT NOT NULL,
        title VARCHAR(150) NOT NULL,
        category_id INT DEFAULT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'Under Review',
        health_score INT NOT NULL DEFAULT 100,
        health_reasons TEXT DEFAULT NULL, -- JSON array
        ai_summary TEXT DEFAULT NULL,
        next_hearing_date DATETIME DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (advocate_id) REFERENCES advocates(id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES legal_categories(id) ON DELETE SET NULL,
        INDEX idx_cases_client (client_id),
        INDEX idx_cases_advocate (advocate_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('- Table "cases" verified/created.');

    // 6. Create case_updates table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS case_updates (
        id INT AUTO_INCREMENT PRIMARY KEY,
        case_id INT NOT NULL,
        update_date DATETIME NOT NULL,
        title VARCHAR(150) NOT NULL,
        description TEXT NOT NULL,
        ai_explanation TEXT DEFAULT NULL,
        stage VARCHAR(100) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
        INDEX idx_case_updates_case (case_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('- Table "case_updates" verified/created.');

    // 7. Create documents table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id INT AUTO_INCREMENT PRIMARY KEY,
        case_id INT DEFAULT NULL,
        user_id INT NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        file_path VARCHAR(255) DEFAULT NULL,
        file_type VARCHAR(50) DEFAULT NULL,
        summary TEXT DEFAULT NULL,
        key_points TEXT DEFAULT NULL, -- JSON array
        difficult_words TEXT DEFAULT NULL, -- JSON object
        missing_documents TEXT DEFAULT NULL, -- JSON array
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE SET NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_documents_case (case_id),
        INDEX idx_documents_user (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('- Table "documents" verified/created.');

    // 8. Create reviews table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id INT AUTO_INCREMENT PRIMARY KEY,
        client_id INT NOT NULL,
        advocate_id INT NOT NULL,
        rating INT NOT NULL CHECK(rating >= 1 AND rating <= 5),
        comment TEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (advocate_id) REFERENCES advocates(id) ON DELETE CASCADE,
        INDEX idx_reviews_advocate (advocate_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('- Table "reviews" verified/created.');

    // 9. Create notifications table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_notifications_user (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('- Table "notifications" verified/created.');

    // 10. Create ai_chat_history table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS ai_chat_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        message TEXT NOT NULL,
        response TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_chat_user (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('- Table "ai_chat_history" verified/created.');

    // --- SEEDING/MIGRATING LEGAL CATEGORIES ---
    // Rename old categories if they exist to match the new names
    await connection.query("UPDATE legal_categories SET name = 'Property Law' WHERE name = 'Property Dispute'");
    await connection.query("UPDATE legal_categories SET name = 'Labour Law' WHERE name = 'Labor/Employment Dispute'");
    await connection.query("UPDATE legal_categories SET name = 'Consumer Law' WHERE name = 'Consumer Protection'");

    console.log('Seeding/verifying legal categories...');
    const categories = [
      ['Family Law', 'Deals with divorce, child custody, alimony, and family property division.'],
      ['Civil Law', 'Covers non-criminal disputes including contract breaches, defamation, and compensation recovery.'],
      ['Criminal Law', 'Covers criminal offenses, FIRs, bail, trial representations, and defense.'],
      ['Property Law', 'Deals with real estate transactions, landlord-tenant issues, land registration, and ownership disputes.'],
      ['Consumer Law', 'Defends consumer rights, product quality disputes, services complaints, and refund issues.'],
      ['Cyber Law', 'Cybercrime, data privacy, online fraud.'],
      ['Labour Law', 'Handles workplace disputes, wages, wrongful termination, and worker rights.'],
      ['Corporate Law', 'Business registration, mergers, compliance.'],
      ['Tax Law', 'Income tax, GST, tax evasion disputes.'],
      ['Banking Law', 'Loan disputes, NPA, cheque dishonour, SARFAESI.'],
      ['Motor Accident Claims', 'MACT claims, insurance disputes, accident compensation.'],
      ['Medical Negligence', 'Hospital malpractice, wrong treatment, compensation.'],
      ['Divorce', 'Contested and mutual consent divorce proceedings.'],
      ['Domestic Violence', 'Protection orders, shelter, DV Act cases.'],
      ['Child Custody', 'Custody battles, visitation rights, guardianship.'],
      ['Senior Citizen Law', 'Maintenance, property rights, elder abuse.'],
      ['Women Protection', 'Harassment, rape laws, POCSO, women rights.'],
      ['Constitutional Law', 'Fundamental rights, PILs, constitutional petitions.'],
      ['Environmental Law', 'Pollution, forest, green tribunal, NGT cases.'],
      ['Intellectual Property', 'Patents, trademarks, copyright, trade secrets.'],
      ['Real Estate', 'RERA disputes, builder fraud, property registration.'],
      ['Cheque Bounce', 'Section 138 NI Act cheque dishonour cases.'],
      ['Land Disputes', 'Survey, encroachment, title, mutation records.'],
      ['Education Law', 'Admission disputes, RTI in education, fee hike.'],
      ['Immigration Law', 'Visa, OCI, passport, citizenship disputes.']
    ];

    for (const cat of categories) {
      const [exists] = await connection.query('SELECT id FROM legal_categories WHERE name = ?', [cat[0]]);
      if (exists.length === 0) {
        await connection.query('INSERT INTO legal_categories (name, description) VALUES (?, ?)', cat);
      }
    }

    // Retrieve categories for mapping
    const [categoriesDb] = await connection.query('SELECT id, name FROM legal_categories');
    const catMap = {};
    categoriesDb.forEach(c => {
      catMap[c.name] = c.id;
    });

    // Check users
    const [existingUsers] = await connection.query('SELECT COUNT(*) as count FROM users');
    if (existingUsers[0].count === 0) {
      console.log('Seeding users (clients and advocates)...');
      const salt = bcrypt.genSaltSync(10);
      const defaultPasswordHash = bcrypt.hashSync('password123', salt);

      // We need 5 clients and 10 advocates
      const clientsData = [
        ['Ramesh Kumar', 'ramesh@example.com', defaultPasswordHash, 'client', '9876543210', 'hi'],
        ['Ananya Rao', 'ananya@example.com', defaultPasswordHash, 'client', '8765432109', 'te'],
        ['Savitri Devi', 'savitri@example.com', defaultPasswordHash, 'client', '7654321098', 'hi'],
        ['John Miller', 'john@example.com', defaultPasswordHash, 'client', '6543210987', 'en'],
        ['Prakash Patel', 'prakash@example.com', defaultPasswordHash, 'client', '5432109876', 'en']
      ];

      const advocatesData = [
        ['Adv. Aditi Sharma', 'aditi@example.com', defaultPasswordHash, 'advocate', '9999888877', 'hi'],
        ['Adv. K. Srinivasa Rao', 'srinivasa@example.com', defaultPasswordHash, 'advocate', '9999888876', 'te'],
        ['Adv. Meera Desai', 'meera@example.com', defaultPasswordHash, 'advocate', '9999888875', 'en'],
        ['Adv. Sanjay Verma', 'sanjay@example.com', defaultPasswordHash, 'advocate', '9999888874', 'hi'],
        ['Adv. Rajesh Reddy', 'rajesh@example.com', defaultPasswordHash, 'advocate', '9999888873', 'te'],
        ['Adv. Vikram Singh', 'vikram@example.com', defaultPasswordHash, 'advocate', '9999888872', 'en'],
        ['Adv. Priya Nair', 'priya@example.com', defaultPasswordHash, 'advocate', '9999888871', 'en'],
        ['Adv. Manoj Patil', 'manoj@example.com', defaultPasswordHash, 'advocate', '9999888870', 'hi'],
        ['Adv. Sandeep Naidu', 'sandeep@example.com', defaultPasswordHash, 'advocate', '9999888869', 'te'],
        ['Adv. Joseph Anthony', 'joseph@example.com', defaultPasswordHash, 'advocate', '9999888868', 'en']
      ];

      // Insert clients
      for (const client of clientsData) {
        await connection.query(
          'INSERT INTO users (name, email, password_hash, role, phone, language_preference) VALUES (?, ?, ?, ?, ?, ?)',
          client
        );
      }

      // Insert advocates
      for (const adv of advocatesData) {
        await connection.query(
          'INSERT INTO users (name, email, password_hash, role, phone, language_preference) VALUES (?, ?, ?, ?, ?, ?)',
          adv
        );
      }

      console.log('Seeded users.');

      // Fetch newly created users to link to advocates
      const [allUsers] = await connection.query('SELECT id, name, role FROM users');
      const clientIds = allUsers.filter(u => u.role === 'client').map(u => u.id);
      const advocateUserList = allUsers.filter(u => u.role === 'advocate');

      console.log('Seeding advocates details...');
      // 10 advocates
      const advocatesDetails = [
        {
          email: 'aditi@example.com',
          bar_registration: 'BAR/DEL/2012/987',
          specialization: 'Family Law',
          experience: 12,
          languages: 'English, Hindi',
          biography: 'Experienced Family Advocate dedicated to handling divorce, child custody, and legal inheritance disputes with compassion and rigor.',
          fee: 1500.00,
          location: 'New Delhi',
          rating: 4.8,
          photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
          availability: 'Available Tomorrow'
        },
        {
          email: 'srinivasa@example.com',
          bar_registration: 'BAR/AP/1998/142',
          specialization: 'Property Law',
          experience: 25,
          languages: 'English, Telugu',
          biography: 'Senior property advocate. Expertise in land registry title verification, builder disputes, tenancy, and joint development agreements.',
          fee: 2500.00,
          location: 'Hyderabad',
          rating: 4.9,
          photo: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150',
          availability: 'Available Tomorrow'
        },
        {
          email: 'meera@example.com',
          bar_registration: 'BAR/MAH/2015/634',
          specialization: 'Civil Law',
          experience: 9,
          languages: 'English, Hindi',
          biography: 'Specializes in civil disputes, contract violations, damages claims, and consumer protection litigation.',
          fee: 1200.00,
          location: 'Mumbai',
          rating: 4.7,
          photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
          availability: 'Available on Monday'
        },
        {
          email: 'sanjay@example.com',
          bar_registration: 'BAR/UP/2005/778',
          specialization: 'Criminal Law',
          experience: 19,
          languages: 'Hindi, English',
          biography: 'Expert criminal defense lawyer, specializing in regular & anticipatory bail applications, criminal trials, and cyber-crime litigation.',
          fee: 2000.00,
          location: 'Lucknow',
          rating: 4.9,
          photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
          availability: 'Available Tomorrow'
        },
        {
          email: 'rajesh@example.com',
          bar_registration: 'BAR/TS/2016/512',
          specialization: 'Labour Law',
          experience: 8,
          languages: 'Telugu, English',
          biography: 'Advocate specializing in employment disputes, labor court representations, gratuity claims, and work safety violations.',
          fee: 1000.00,
          location: 'Visakhapatnam',
          rating: 4.5,
          photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
          availability: 'Available Today'
        },
        {
          email: 'vikram@example.com',
          bar_registration: 'BAR/KAR/2010/894',
          specialization: 'Consumer Law',
          experience: 14,
          languages: 'English, Kannada, Hindi',
          biography: 'Passionate advocate representing consumers against deceptive business practices, product defects, and insurance claim denials.',
          fee: 1500.00,
          location: 'Bengaluru',
          rating: 4.6,
          photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
          availability: 'Available in 2 Days'
        },
        {
          email: 'priya@example.com',
          bar_registration: 'BAR/KER/2018/223',
          specialization: 'Family Law',
          experience: 6,
          languages: 'English, Malayalam',
          biography: 'Focuses on marital disputes, family mediation, adoption procedures, and domestic rights counselling.',
          fee: 800.00,
          location: 'Kochi',
          rating: 4.4,
          photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
          availability: 'Available Today'
        },
        {
          email: 'manoj@example.com',
          bar_registration: 'BAR/MP/2007/351',
          specialization: 'Property Law',
          experience: 17,
          languages: 'Hindi, English',
          biography: 'Deals extensively with land encroachment cases, partition suits, and ancestral property title disputes.',
          fee: 1800.00,
          location: 'Bhopal',
          rating: 4.8,
          photo: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
          availability: 'Available Tomorrow'
        },
        {
          email: 'sandeep@example.com',
          bar_registration: 'BAR/AP/2013/889',
          specialization: 'Criminal Law',
          experience: 11,
          languages: 'Telugu, English',
          biography: 'Defense counsel for cases involving financial fraud, bails, FIR quashing, and sessions trial representation.',
          fee: 1700.00,
          location: 'Vijayawada',
          rating: 4.7,
          photo: 'https://images.unsplash.com/photo-1556157382-97eda2d62296?w=150',
          availability: 'Available Tomorrow'
        },
        {
          email: 'joseph@example.com',
          bar_registration: 'BAR/TN/2002/103',
          specialization: 'Civil Law',
          experience: 22,
          languages: 'English, Tamil',
          biography: 'Expert civil litigator handling high-stakes commercial disputes, damage claims, breach of trust, and injunction suits.',
          fee: 3000.00,
          location: 'Chennai',
          rating: 4.9,
          photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
          availability: 'Available in 3 Days'
        }
      ];

      for (const advDet of advocatesDetails) {
        const u = advocateUserList.find(x => x.name.toLowerCase().includes(advDet.email.split('@')[0]));
        if (u) {
          const categoryId = catMap[advDet.specialization];
          await connection.query(
            `INSERT INTO advocates (user_id, bar_registration, specialization_id, experience_years, languages, biography, consultation_fee, location, rating, profile_photo, availability) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              u.id,
              advDet.bar_registration,
              categoryId,
              advDet.experience,
              advDet.languages,
              advDet.biography,
              advDet.fee,
              advDet.location,
              advDet.rating,
              advDet.photo,
              advDet.availability
            ]
          );
        }
      }
      console.log('Seeded advocates.');

      // Fetch advocates for linking appointments and cases
      const [advocatesDb] = await connection.query('SELECT id, user_id, consultation_fee, location, specialization_id FROM advocates');

      // Seeding 10 Reviews
      console.log('Seeding reviews...');
      const reviews = [
        [clientIds[0], advocatesDb[0].id, 5, 'Advocate Aditi helped my family settle an alimony dispute peacefully. Very professional and polite.'],
        [clientIds[1], advocatesDb[1].id, 5, 'Rao Garu is extremely knowledgeable. He checked my property papers thoroughly and saved me from a major scam.'],
        [clientIds[2], advocatesDb[3].id, 4, 'Sanjay Verma got bail for my son in a complex theft accusation. Very strong courtroom representation.'],
        [clientIds[3], advocatesDb[2].id, 5, 'Priya was helpful. She resolved our tenancy contract dispute in a week.'],
        [clientIds[4], advocatesDb[5].id, 4, 'Adv. Vikram helped with a consumer forum complaint. Good results, though the process took some time.'],
        [clientIds[0], advocatesDb[7].id, 5, 'Adv. Manoj was brilliant with our ancestral land encroachment issue. Highly recommended.'],
        [clientIds[1], advocatesDb[8].id, 5, 'Very quick bail filing and clear explanation of the court terms.'],
        [clientIds[2], advocatesDb[0].id, 4, 'Compassionate listener. Solved my divorce consultation queries in detail.'],
        [clientIds[3], advocatesDb[9].id, 5, 'Joseph solved a high-value commercial breach contract. Worth every rupee of consultation.'],
        [clientIds[4], advocatesDb[4].id, 5, 'Rajesh represented me in a wrongful termination suit. Settled out of court successfully.']
      ];
      await connection.query('INSERT INTO reviews (client_id, advocate_id, rating, comment) VALUES ?', [reviews]);
      console.log('Seeded reviews.');

      // Seeding 5 Cases
      console.log('Seeding cases...');
      const casesData = [
        {
          client_id: clientIds[0],
          advocate_id: advocatesDb[0].id, // Aditi (Family)
          title: 'Mutual Consent Divorce & Maintenance Division',
          category_id: catMap['Family Law'],
          status: 'Adjourned for filing response',
          health_score: 85,
          health_reasons: JSON.stringify(['Advocate Assigned', 'Initial Petition Filed', 'Income Declarations Missing']),
          ai_summary: 'This case involves a mutual consent divorce petition filed by the parties. Current dispute is regarding the fair evaluation of joint family assets and permanent alimony settlement.',
          next_hearing_date: '2026-08-14 10:30:00'
        },
        {
          client_id: clientIds[1],
          advocate_id: advocatesDb[1].id, // Srinivasa (Property)
          title: 'Title Suit & Injunction Order against Encroachment',
          category_id: catMap['Property Law'],
          status: 'Hearing Scheduled',
          health_score: 95,
          health_reasons: JSON.stringify(['Advocate Assigned', 'Property Deeds Uploaded', 'Boundary Survey Done', 'Next Hearing Confirmed']),
          ai_summary: 'Suit filed for declaration of property title and permanent injunction against neighbor encroaching upon a 200 sq. yard plot in Hyderabad.',
          next_hearing_date: '2026-07-28 11:00:00'
        },
        {
          client_id: clientIds[2],
          advocate_id: advocatesDb[3].id, // Sanjay (Criminal)
          title: 'Quashing of False FIR under IPC Section 420',
          category_id: catMap['Criminal Law'],
          status: 'Under Review',
          health_score: 65,
          health_reasons: JSON.stringify(['Advocate Assigned', 'FIR Copy Uploaded', 'Affidavit Pending Signature', 'Bail Bond Payment Pending']),
          ai_summary: 'Petition filed under Section 482 of CrPC seeking the quashing of an FIR alleging cyber-fraud, citing lack of evidence and commercial nature of dispute.',
          next_hearing_date: '2026-09-02 14:00:00'
        },
        {
          client_id: clientIds[3],
          advocate_id: advocatesDb[9].id, // Joseph (Civil)
          title: 'Commercial Contract Breach & Liquidated Damages Recovery',
          category_id: catMap['Civil Law'],
          status: 'Notice Served',
          health_score: 80,
          health_reasons: JSON.stringify(['Advocate Assigned', 'Agreement Uploaded', 'Legal Notice Served', 'Awaiting Reply from Opponent']),
          ai_summary: 'Recovery of Rs. 15,00,000 for failure to supply industrial raw materials under the signed Supply Agreement dated Feb 2025.',
          next_hearing_date: '2026-08-10 10:00:00'
        },
        {
          client_id: clientIds[4],
          advocate_id: advocatesDb[4].id, // Rajesh (Labor)
          title: 'Wrongful Dismissal & Recovery of Unpaid Gratuity',
          category_id: catMap['Labour Law'],
          status: 'Mediation Stage',
          health_score: 90,
          health_reasons: JSON.stringify(['Advocate Assigned', 'Employment Contract Uploaded', 'Salary Slips Provided', 'Employer Summoned']),
          ai_summary: 'Representing employee Ramesh for recovery of 9 months of unpaid wages, PF deposits, and gratuity payouts post wrongful layoff.',
          next_hearing_date: '2026-08-01 15:30:00'
        }
      ];

      for (const c of casesData) {
        await connection.query(
          `INSERT INTO cases (client_id, advocate_id, title, category_id, status, health_score, health_reasons, ai_summary, next_hearing_date)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [c.client_id, c.advocate_id, c.title, c.category_id, c.status, c.health_score, c.health_reasons, c.ai_summary, c.next_hearing_date]
        );
      }
      console.log('Seeded cases.');

      // Fetch case IDs
      const [casesDb] = await connection.query('SELECT id, client_id, advocate_id FROM cases');

      // Seeding 15 Case Updates
      console.log('Seeding case updates...');
      const caseUpdates = [
        // Case 1 (Divorce)
        [casesDb[0].id, '2026-05-10 10:00:00', 'Petition Filed', 'The initial divorce petition was drafted and submitted to the Family Court.', 'The divorce case has officially started by filing the request documents in court.', 'Filing Petition'],
        [casesDb[0].id, '2026-06-12 11:30:00', 'Summons Issued', 'Court issued summons to the respondent spouse to appear on the next hearing.', 'The court has ordered your spouse to come to court for the next hearing.', 'Summons Issued'],
        [casesDb[0].id, '2026-07-02 10:00:00', 'Counseling Session', 'Both parties attended the mandatory court marriage counseling session.', 'The court counselor met with both of you to see if you can resolve issues amicably.', 'Counseling Session'],
        [casesDb[0].id, '2026-07-15 10:00:00', 'Matter adjourned for filing counter', 'The court postponed the hearing as the respondent requested more time to submit their reply affidavit.', 'The hearing was postponed because the other party needs time to submit their response.', 'Written Statement Filing'],

        // Case 2 (Property)
        [casesDb[1].id, '2026-04-12 10:00:00', 'Suit for Title Filed', 'Plaint registered in the Civil Court for declaration of ownership.', 'We have officially filed a case in court claiming ownership of the land.', 'Filing Suit'],
        [casesDb[1].id, '2026-05-20 11:00:00', 'Temporary Injunction Application', 'Arguments heard on injunction to stop construction work.', 'We asked the court to temporarily stop the neighbor from building anything on the plot.', 'Injunction Hearing'],
        [casesDb[1].id, '2026-06-05 14:00:00', 'Status Quo Granted', 'Court ordered status quo to be maintained on the property by both parties.', 'The judge ordered that neither you nor the neighbor can change the property state until further notice.', 'Injunction Order'],

        // Case 3 (Criminal FIR)
        [casesDb[2].id, '2026-06-01 10:00:00', 'FIR Copy Obtained', 'Obtained certified copy of FIR registered at Police Station.', 'We successfully got the police FIR copy detailing what charges they have written against you.', 'FIR Analysis'],
        [casesDb[2].id, '2026-06-15 11:00:00', 'Anticipatory Bail Granted', 'Sessions Court granted anticipatory bail to the client.', 'The court ordered that the police cannot arrest you while this case is being reviewed.', 'Bail Hearing'],
        [casesDb[2].id, '2026-07-10 10:00:00', 'Quash Petition Filed in High Court', 'Filed application under Section 482 of CrPC to quash the false FIR.', 'We have requested the High Court to cancel the police case completely.', 'Filing Quash Petition'],

        // Case 4 (Civil Contract)
        [casesDb[3].id, '2026-05-02 10:00:00', 'Legal Notice Drafted', 'Drafted and approved demand notice detailing breach terms.', 'We prepared a formal demand letter explaining how the seller broke their promise.', 'Drafting Notice'],
        [casesDb[3].id, '2026-05-15 12:00:00', 'Legal Notice Served', 'Sent registered legal notice to the respondent.', 'We sent the formal demand letter to the other party via registered post.', 'Serving Notice'],
        [casesDb[3].id, '2026-06-30 10:00:00', 'Civil Suit for Recovery Registered', 'Filed suit in commercial division after non-compliance of notice.', 'Since they did not pay back, we have filed a formal commercial lawsuit to recover the money.', 'Filing Suit'],

        // Case 5 (Labor wages)
        [casesDb[4].id, '2026-05-12 10:00:00', 'Complaint Filed in Labor Commissioner Office', 'Submitted representation regarding unpaid wages and illegal lockout.', 'We filed an official complaint with the Labor Officer regarding your salary.', 'Filing Complaint'],
        [casesDb[4].id, '2026-06-25 11:30:00', 'Employer Conciliation Summons', 'Conciliation officer summoned the employer for meeting.', 'The Labor Officer has ordered the employer to attend a joint discussion with us.', 'Conciliation Meeting']
      ];

      for (const cu of caseUpdates) {
        await connection.query(
          `INSERT INTO case_updates (case_id, update_date, title, description, ai_explanation, stage)
           VALUES (?, ?, ?, ?, ?, ?)`,
          cu
        );
      }
      console.log('Seeded case updates.');

      // Seeding 15 Appointments
      console.log('Seeding appointments...');
      const appointmentsData = [
        [clientIds[0], advocatesDb[0].id, '2026-07-17 10:30:00', 'scheduled', 'Initial discussion about child support calculations.'],
        [clientIds[1], advocatesDb[1].id, '2026-07-18 11:00:00', 'scheduled', 'Verifying the boundary survey documents.'],
        [clientIds[2], advocatesDb[3].id, '2026-07-17 16:00:00', 'scheduled', 'Drafting character witness affidavit.'],
        [clientIds[3], advocatesDb[9].id, '2026-07-20 14:00:00', 'pending', 'Reviewing the draft reply of respondent.'],
        [clientIds[4], advocatesDb[4].id, '2026-07-22 15:30:00', 'scheduled', 'Preparing for Labor Officer meeting.'],
        [clientIds[0], advocatesDb[0].id, '2026-06-01 10:30:00', 'completed', 'Discussing counseling strategies.'],
        [clientIds[1], advocatesDb[1].id, '2026-06-10 11:00:00', 'completed', 'Consultation about temporary injunction filing.'],
        [clientIds[2], advocatesDb[3].id, '2026-06-15 15:00:00', 'completed', 'Preparing bail bond paperwork.'],
        [clientIds[3], advocatesDb[9].id, '2026-06-22 14:00:00', 'completed', 'Reviewing contract clauses and supplier receipts.'],
        [clientIds[4], advocatesDb[4].id, '2026-06-28 10:00:00', 'completed', 'First client onboarding and employment slip checks.'],
        [clientIds[0], advocatesDb[0].id, '2026-07-12 11:00:00', 'completed', 'Discussing counter allegations filed.'],
        [clientIds[1], advocatesDb[1].id, '2026-07-05 10:00:00', 'completed', 'Boundary dispute mediation attempt.'],
        [clientIds[2], advocatesDb[3].id, '2026-07-08 14:30:00', 'completed', 'High Court quash petition review.'],
        [clientIds[3], advocatesDb[9].id, '2026-07-14 11:00:00', 'completed', 'Discussing civil summons serving details.'],
        [clientIds[4], advocatesDb[4].id, '2026-07-10 16:00:00', 'completed', 'Meeting with secondary labor union representative.']
      ];
      await connection.query(
        'INSERT INTO appointments (client_id, advocate_id, appointment_date, status, notes) VALUES ?',
        [appointmentsData]
      );
      console.log('Seeded appointments.');

      // Seeding a few notifications and mock chat history
      console.log('Seeding notification alerts...');
      await connection.query(`
        INSERT INTO notifications (user_id, message, is_read) VALUES
        (${clientIds[0]}, 'Your advocate Adv. Aditi Sharma scheduled a new consultation for child support.', false),
        (${clientIds[1]}, 'Status update: The boundary dispute hearing was adjourned to July 28.', false),
        (${clientIds[2]}, 'Anticipatory bail petition was approved. Print copy is ready.', true)
      `);

      // Seeding a sample document
      console.log('Seeding sample documents...');
      const docsData = [
        {
          case_id: casesDb[0].id,
          user_id: clientIds[0],
          file_name: 'Mutual_Agreement_Draft_Signed.pdf',
          file_path: '/uploads/Mutual_Agreement_Draft_Signed.pdf',
          file_type: 'Agreement',
          summary: 'Mutual agreement outline for divorce listing split of assets, child custody on weekends, and a waiver of future claims.',
          key_points: JSON.stringify(['Wife keeps flat in Gurgaon', 'Joint custody of 8-year-old child', 'One-time settlement of Rs. 20 Lakhs agreed']),
          difficult_words: JSON.stringify({
            'alimony': 'A regular sum of money that a court orders a person to pay to their partner after divorce.',
            'custody': 'The legal right to look after a child.',
            'waiver': 'An agreement where you voluntarily give up a legal right.'
          }),
          missing_documents: JSON.stringify(['Income Certificates', 'Joint Bank Statements'])
        }
      ];
      for (const d of docsData) {
        await connection.query(
          `INSERT INTO documents (case_id, user_id, file_name, file_path, file_type, summary, key_points, difficult_words, missing_documents)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [d.case_id, d.user_id, d.file_name, d.file_path, d.file_type, d.summary, d.key_points, d.difficult_words, d.missing_documents]
        );
      }
      console.log('Seeded documents.');
    } else {
      console.log('Database already has data. Skipping seed step.');
    }

    console.log('Nyaya Setu database setup successfully completed!');
  } catch (err) {
    console.error('Error during database setup:', err);
    throw err;
  } finally {
    if (connection) connection.release();
  }
}

// Execute setup
setupDatabase().then(() => {
  process.exit(0);
}).catch(() => {
  process.exit(1);
});
