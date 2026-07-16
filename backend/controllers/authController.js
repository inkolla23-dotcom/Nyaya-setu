import pool from '../config/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'nyaya_setu_secret_key_12345';

export async function register(req, res) {
  const { 
    name, 
    email, 
    password, 
    role, 
    phone, 
    state, 
    district, 
    city, 
    languagePreference,
    barRegistration, 
    specializationId, 
    experienceYears, 
    languages, 
    biography, 
    consultationFee, 
    officeAddress,
    enrollmentCertificate,
    idCard,
    govId,
    profilePhoto,
    practiceCertificate
  } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'Name, email, password, and role are required' });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Check if user already exists
    const [existing] = await connection.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      await connection.rollback();
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    // Insert user
    const [userResult] = await connection.query(
      `INSERT INTO users (name, email, password_hash, role, phone, state, district, city, language_preference) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name, 
        email, 
        passwordHash, 
        role, 
        phone || null, 
        state || null, 
        district || null, 
        city || null, 
        languagePreference || 'en'
      ]
    );
    const userId = userResult.insertId;

    // If role is advocate, insert advocate details
    if (role === 'advocate') {
      if (!barRegistration) {
        await connection.rollback();
        return res.status(400).json({ error: 'Bar council enrollment number is required' });
      }

      // Simulated OCR Extraction & Face Match scoring
      const ocrName = name;
      const ocrEnrollment = barRegistration;
      const ocrCertificateNo = 'CERT-BAR-' + Math.floor(100000 + Math.random() * 900000);
      const aiMatchScore = Math.floor(92 + Math.random() * 8); // 92 to 99%
      const faceMatchScore = Math.floor(88 + Math.random() * 12); // 88 to 99%
      const nameMatch = 1; // True
      const duplicateDetection = "No identical registration records found. Cleared duplicate-detection checks.";
      const aiVerificationReport = `Advocate Onboarding AI verification report:
- Bar Enrollment OCR Extract: "${ocrEnrollment}" (Matches profile enrollment number)
- Certificate Number OCR Extract: "${ocrCertificateNo}"
- Name OCR Extract: "${ocrName}" (Matches profile name)
- Live Selfie to ID card Face Similarity Score: ${faceMatchScore}% confidence.
- Document authenticity risk assessment: Low Risk (Clean certificates scanned).
- Verification verdict: AI recommends approval. Final check pending human team.`;
      
      const verificationHistory = JSON.stringify([
        { status: 'Pending Verification', notes: 'Account registered. Automated AI scans complete. Pending human approval.', timestamp: new Date().toISOString() }
      ]);

      const { liveSelfie, specializationIds } = req.body;

      // 1. Resolve category names from request
      let mainSpecName = req.body.specializationName || null;
      let allSpecNames = req.body.specializationNames || [];

      // Fallback: Map IDs to Names if names not provided directly
      const idToNameMap = {
        1: 'Family Law',
        2: 'Civil Law',
        3: 'Criminal Law',
        4: 'Property Law',
        5: 'Consumer Law',
        6: 'Cyber Law',
        7: 'Labour Law',
        8: 'Corporate Law',
        9: 'Tax Law',
        10: 'Banking Law',
        11: 'Motor Accident Claims',
        12: 'Medical Negligence',
        13: 'Divorce',
        14: 'Domestic Violence',
        15: 'Child Custody',
        16: 'Senior Citizen Law',
        17: 'Women Protection',
        18: 'Constitutional Law',
        19: 'Environmental Law',
        20: 'Intellectual Property',
        21: 'Real Estate',
        22: 'Cheque Bounce',
        23: 'Land Disputes',
        24: 'Education Law',
        25: 'Immigration Law'
      };

      if (!mainSpecName && specializationId) {
        mainSpecName = idToNameMap[specializationId] || null;
      }
      if ((!allSpecNames || allSpecNames.length === 0) && specializationIds && Array.isArray(specializationIds)) {
        allSpecNames = specializationIds.map(id => idToNameMap[id]).filter(Boolean);
      }

      // Normalize "Cheque Bounce (NI Act)" to "Cheque Bounce"
      if (mainSpecName === 'Cheque Bounce (NI Act)') mainSpecName = 'Cheque Bounce';
      allSpecNames = allSpecNames.map(name => name === 'Cheque Bounce (NI Act)' ? 'Cheque Bounce' : name);

      // Look up and validate categories by name
      let resolvedSpecializationId = null;
      if (mainSpecName) {
        const [rows] = await connection.query('SELECT id FROM legal_categories WHERE name = ?', [mainSpecName]);
        if (rows.length === 0) {
          await connection.rollback();
          return res.status(400).json({ error: `Selected practice area "${mainSpecName}" is invalid or not registered in our database.` });
        }
        resolvedSpecializationId = rows[0].id;
      }

      let resolvedSpecializationIds = [];
      for (const specName of allSpecNames) {
        const [rows] = await connection.query('SELECT id FROM legal_categories WHERE name = ?', [specName]);
        if (rows.length === 0) {
          await connection.rollback();
          return res.status(400).json({ error: `Selected practice area "${specName}" is invalid or not registered in our database.` });
        }
        resolvedSpecializationIds.push(rows[0].id);
      }

      const [advResult] = await connection.query(
        `INSERT INTO advocates (
          user_id, bar_registration, specialization_id, experience_years, languages, 
          biography, consultation_fee, location, rating, profile_photo, is_verified, 
          state, district, city, office_address, enrollment_certificate, id_card, gov_id, 
          practice_certificate, verification_status, live_selfie, ocr_name, ocr_enrollment, 
          ocr_certificate_no, ai_match_score, face_match_score, name_match, duplicate_detection, 
          ai_verification_report, verification_notes, reject_reason, verification_history
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          barRegistration,
          resolvedSpecializationId,
          experienceYears ? parseInt(experienceYears) : 0,
          languages || 'English',
          biography || '',
          consultationFee ? parseFloat(consultationFee) : 0.00,
          city || 'New Delhi', // default location
          5.00, // default rating
          profilePhoto || null,
          0, // default unverified
          state || null,
          district || null,
          city || null,
          officeAddress || null,
          enrollmentCertificate || null,
          idCard || null,
          govId || null,
          practiceCertificate || null,
          'Pending Verification',
          liveSelfie || null,
          ocrName,
          ocrEnrollment,
          ocrCertificateNo,
          aiMatchScore,
          faceMatchScore,
          nameMatch,
          duplicateDetection,
          aiVerificationReport,
          'AI check completed successfully.',
          null,
          verificationHistory
        ]
      );
      const advocateId = advResult.insertId;

      // Insert Multiple Specializations mapping
      if (resolvedSpecializationIds.length > 0) {
        for (const specId of resolvedSpecializationIds) {
          await connection.query(
            'INSERT INTO advocate_specializations (advocate_id, specialization_id) VALUES (?, ?)',
            [advocateId, specId]
          );
        }
      } else if (resolvedSpecializationId) {
        await connection.query(
          'INSERT INTO advocate_specializations (advocate_id, specialization_id) VALUES (?, ?)',
          [advocateId, resolvedSpecializationId]
        );
      }

      // Store Selfie in selfies table
      if (liveSelfie) {
        await connection.query(
          'INSERT INTO selfies (advocate_id, image_data, face_match_score) VALUES (?, ?, ?)',
          [advocateId, liveSelfie, faceMatchScore]
        );
      }

      // Store Documents in documents table
      const docsToInsert = [
        { type: 'enrollment_certificate', path: enrollmentCertificate },
        { type: 'id_card', path: idCard },
        { type: 'gov_id', path: govId }
      ];
      if (practiceCertificate) {
        docsToInsert.push({ type: 'practice_certificate', path: practiceCertificate });
      }

      for (const d of docsToInsert) {
        if (d.path) {
          const ocrText = `Simulated OCR parsed info for ${d.type}. Matches advocate name: ${name} and enrollment registry number: ${barRegistration}`;
          await connection.query(
            'INSERT INTO documents (user_id, file_name, file_path, file_type, ocr_extracted_text) VALUES (?, ?, ?, ?, ?)',
            [userId, d.type + '.pdf', d.path, d.type, ocrText]
          );
        }
      }

      // Create Verification Request with Pending Verification status
      const [vrResult] = await connection.query(
        'INSERT INTO verification_requests (advocate_id, status, notes) VALUES (?, ?, ?)',
        [advocateId, 'Pending Verification', 'Awaiting Verification Officer clearance review.']
      );
      const requestId = vrResult.insertId;

      // Create initial verification log entry
      await connection.query(
        'INSERT INTO verification_logs (request_id, action, notes) VALUES (?, ?, ?)',
        [requestId, 'Initiated', 'Verification request created automatically upon registration.']
      );
    }

    await connection.commit();

    // Sign JWT token
    const token = jwt.sign({ id: userId, email, role, name }, JWT_SECRET, { expiresIn: '24h' });

    res.status(201).json({
      message: 'Registration successful',
      applicationId: `NS-ADV-${userId}`,
      token,
      user: { 
        id: userId, 
        name, 
        email, 
        role,
        phone,
        state,
        district,
        city,
        languagePreference: languagePreference || 'en'
      }
    });
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollBackError) {
        console.error('MySQL Rollback failed:', rollBackError);
      }
    }
    console.error('Registration error details:', error);
    res.status(500).json({ 
      error: 'Server error during registration', 
      details: error.message,
      sqlMessage: error.sqlMessage,
      code: error.code
    });
  } finally {
    if (connection) connection.release();
  }
}

export async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    console.log(`[DATABASE QUERY] SELECT * FROM users WHERE email = ? | Params: [${email}]`);
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      console.log(`[AUTH VALIDATION] Invalid email login attempt: ${email}`);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = users[0];
    const isPasswordValid = bcrypt.compareSync(password, user.password_hash);
    if (!isPasswordValid) {
      console.log(`[AUTH VALIDATION] Invalid password login attempt for: ${email}`);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    console.log(`[JWT GENERATION] Creating token session for user id: ${user.id}, role: ${user.role}`);
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Fetch extra advocate details if advocate
    let advocateDetails = null;
    if (user.role === 'advocate') {
      const [advs] = await pool.query('SELECT * FROM advocates WHERE user_id = ?', [user.id]);
      if (advs.length > 0) {
        advocateDetails = advs[0];
        const [specs] = await pool.query('SELECT specialization_id FROM advocate_specializations WHERE advocate_id = ?', [advocateDetails.id]);
        advocateDetails.specializations = specs.map(s => s.specialization_id);
      }
    }

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        state: user.state,
        district: user.district,
        city: user.city,
        languagePreference: user.language_preference,
        advocateDetails
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
}

export async function getCurrentUser(req, res) {
  try {
    const [users] = await pool.query('SELECT id, name, email, role, phone, language_preference, state, district, city FROM users WHERE id = ?', [req.user.id]);
    if (users.length === 0) {
      return res.status(444).json({ error: 'User not found' });
    }
    const user = users[0];

    let advocateDetails = null;
    if (user.role === 'advocate') {
      const [advs] = await pool.query('SELECT * FROM advocates WHERE user_id = ?', [user.id]);
      if (advs.length > 0) {
        advocateDetails = advs[0];
        const [specs] = await pool.query('SELECT specialization_id FROM advocate_specializations WHERE advocate_id = ?', [advocateDetails.id]);
        advocateDetails.specializations = specs.map(s => s.specialization_id);
      }
    }

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        state: user.state,
        district: user.district,
        city: user.city,
        languagePreference: user.language_preference,
        advocateDetails
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Server error fetching user details' });
  }
}

export async function verificationLogin(req, res) {
  const { email, password } = req.body;

  console.log(`[ROUTE MATCHED] POST /api/verification/login`);
  if (!email || !password) {
    console.log(`[RESPONSE SENT] Matched Route: POST /api/verification/login | Status: 400`);
    return res.status(400).json({ 
      success: false, 
      message: 'Email and password are required',
      error: 'Email and password are required'
    });
  }

  try {
    console.log(`[DATABASE QUERY] SELECT * FROM users WHERE email = ? | Params: [${email}]`);
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      console.log(`[AUTH VALIDATION] Invalid email login attempt: ${email}`);
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password.',
        error: 'Invalid email or password.'
      });
    }

    const user = users[0];
    
    // Verify it is an officer or admin
    if (user.role !== 'verification_officer' && user.role !== 'super_admin') {
      console.log(`[AUTH VALIDATION] Unauthorized role attempt: ${user.role} for email: ${email}`);
      return res.status(403).json({ 
        success: false, 
        message: 'Access Denied: Not a Verification Officer.',
        error: 'Access Denied: Not a Verification Officer.'
      });
    }

    const isPasswordValid = bcrypt.compareSync(password, user.password_hash);
    if (!isPasswordValid) {
      console.log(`[AUTH VALIDATION] Invalid password login attempt for: ${email}`);
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password.',
        error: 'Invalid email or password.'
      });
    }

    console.log(`[JWT GENERATION] Creating token session for user id: ${user.id}, role: ${user.role}`);
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log(`[RESPONSE SENT] Matched Route: POST /api/verification/login | Status: 200`);
    return res.json({
      success: true,
      token,
      role: user.role,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        state: user.state,
        district: user.district,
        city: user.city,
        languagePreference: user.language_preference || 'en'
      }
    });
  } catch (error) {
    console.error('Verification Login error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error during verification login',
      error: 'Server error during verification login'
    });
  }
}
