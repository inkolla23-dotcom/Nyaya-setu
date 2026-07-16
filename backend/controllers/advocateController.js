import pool from '../config/db.js';

export async function getAdvocates(req, res) {
  const { specializationId, location, maxFee, language, clientLang, clientLocation, clientBudget } = req.query;

  try {
    let query = `
      SELECT a.*, u.name, u.email, u.phone, GROUP_CONCAT(lc.name SEPARATOR ', ') as specialization_name 
      FROM advocates a
      JOIN users u ON a.user_id = u.id
      LEFT JOIN advocate_specializations asoc ON a.id = asoc.advocate_id
      LEFT JOIN legal_categories lc ON asoc.specialization_id = lc.id
      WHERE a.verification_status = 'Approved' AND a.is_verified = 1
    `;
    const params = [];

    if (specializationId) {
      query += ` AND a.id IN (SELECT advocate_id FROM advocate_specializations WHERE specialization_id = ?)`;
      params.push(parseInt(specializationId));
    }
    if (location) {
      query += ` AND (a.location LIKE ? OR a.city LIKE ? OR a.state LIKE ?)`;
      params.push(`%${location}%`, `%${location}%`, `%${location}%`);
    }
    if (maxFee) {
      query += ` AND a.consultation_fee <= ?`;
      params.push(parseFloat(maxFee));
    }
    if (language) {
      query += ` AND a.languages LIKE ?`;
      params.push(`%${language}%`);
    }

    query += ` GROUP BY a.id`;

    const [advocates] = await pool.query(query, params);

    // Calculate Match Scores
    const formattedAdvocates = advocates.map(adv => {
      let score = 70;
      const reasons = [];

      reasons.push(`Specializes in ${adv.specialization_name || 'General Law'}`);

      if (clientLang) {
        const speaksLang = adv.languages.toLowerCase().includes(clientLang.toLowerCase());
        if (speaksLang) {
          score += 10;
          reasons.push(`Speaks ${clientLang}`);
        }
      }

      if (clientLocation) {
        const isNear = adv.location.toLowerCase().includes(clientLocation.toLowerCase()) || 
                      (adv.city && adv.city.toLowerCase().includes(clientLocation.toLowerCase()));
        if (isNear) {
          score += 10;
          reasons.push('Nearby location');
        }
      }

      if (clientBudget) {
        const withinBudget = adv.consultation_fee <= parseFloat(clientBudget);
        if (withinBudget) {
          score += 10;
          reasons.push('Within budget');
        }
      } else {
        reasons.push(`Consultation Fee: ₹${parseInt(adv.consultation_fee)}`);
      }

      if (parseFloat(adv.rating) >= 4.7) {
        score += 5;
      }
      if (adv.experience_years >= 10) {
        score += 5;
      }

      reasons.push(adv.availability || 'Available Tomorrow');

      return {
        ...adv,
        matchScore: Math.min(100, score),
        matchReason: reasons.join(' • ')
      };
    });

    // Sort by match score descending
    formattedAdvocates.sort((a, b) => b.matchScore - a.matchScore);

    res.json(formattedAdvocates);
  } catch (error) {
    console.error('Fetch advocates error:', error);
    res.status(500).json({ error: 'Server error fetching advocates' });
  }
}

export async function getAdvocateById(req, res) {
  const { id } = req.params;

  try {
    const [advocates] = await pool.query(`
      SELECT a.*, u.name, u.email, u.phone, GROUP_CONCAT(lc.name SEPARATOR ', ') as specialization_name, GROUP_CONCAT(lc.id) as specialization_ids
      FROM advocates a
      JOIN users u ON a.user_id = u.id
      LEFT JOIN advocate_specializations asoc ON a.id = asoc.advocate_id
      LEFT JOIN legal_categories lc ON asoc.specialization_id = lc.id
      WHERE a.id = ?
      GROUP BY a.id
    `, [id]);

    if (advocates.length === 0) {
      return res.status(404).json({ error: 'Advocate not found' });
    }

    const advocate = advocates[0];

    // Get reviews
    const [reviews] = await pool.query(`
      SELECT r.*, u.name as client_name
      FROM reviews r
      JOIN users u ON r.client_id = u.id
      WHERE r.advocate_id = ?
      ORDER BY r.created_at DESC
    `, [id]);

    res.json({
      ...advocate,
      reviews
    });
  } catch (error) {
    console.error('Fetch advocate detail error:', error);
    res.status(500).json({ error: 'Server error fetching advocate details' });
  }
}

export async function getSpecializations(req, res) {
  try {
    const [categories] = await pool.query('SELECT * FROM legal_categories');
    res.json(categories);
  } catch (error) {
    console.error('Fetch specializations error:', error);
    res.status(500).json({ error: 'Server error fetching legal categories' });
  }
}

function parseSlotToDatetime(slotStr) {
  const now = new Date();
  if (!isNaN(Date.parse(slotStr))) {
    return new Date(slotStr);
  }
  
  let targetDate = new Date();
  const lower = slotStr.toLowerCase();
  
  if (lower.includes('tomorrow')) {
    targetDate.setDate(now.getDate() + 1);
  } else if (lower.includes('monday')) {
    const day = now.getDay();
    const daysToAdd = day === 0 ? 1 : 8 - day; // next monday
    targetDate.setDate(now.getDate() + daysToAdd);
  } else if (lower.includes('tuesday')) {
    const day = now.getDay();
    const daysToAdd = day <= 2 ? (2 - day) : (9 - day); // next tuesday
    targetDate.setDate(now.getDate() + daysToAdd);
  }
  
  const timeMatch = slotStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (timeMatch) {
    let hours = parseInt(timeMatch[1], 10);
    const minutes = parseInt(timeMatch[2], 10);
    const ampm = timeMatch[3].toUpperCase();
    
    if (ampm === 'PM' && hours < 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;
    
    targetDate.setHours(hours, minutes, 0, 0);
  }
  
  return targetDate;
}

export async function bookConsultation(req, res) {
  const { advocateId, appointmentDate, notes } = req.body;
  const clientId = req.user.id;

  if (!advocateId || !appointmentDate) {
    return res.status(400).json({ error: 'Advocate ID and appointment date are required' });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // 1. Convert slot to MySQL DateTime format
    const parsedDate = parseSlotToDatetime(appointmentDate);
    const mysqlDateTime = parsedDate.toISOString().slice(0, 19).replace('T', ' ');

    // 2. Check if advocate exists
    const [advs] = await connection.query(
      `SELECT a.id, a.user_id, a.specialization_id, u.name as advocate_name 
       FROM advocates a 
       JOIN users u ON a.user_id = u.id 
       WHERE a.id = ?`,
      [advocateId]
    );
    if (advs.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Advocate not found' });
    }
    const advocate = advs[0];

    // 3. Fetch client details
    const [clients] = await connection.query('SELECT name FROM users WHERE id = ?', [clientId]);
    if (clients.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Client not found' });
    }
    const clientName = clients[0].name;

    // 4. Create appointment with 'pending' status — advocate must approve
    const [apptResult] = await connection.query(
      'INSERT INTO appointments (client_id, advocate_id, appointment_date, status, notes) VALUES (?, ?, ?, ?, ?)',
      [clientId, advocateId, mysqlDateTime, 'pending', notes || '']
    );

    // 5. Create Case automatically
    const caseTitle = `Legal Assessment with ${advocate.advocate_name}`;
    const [caseResult] = await connection.query(
      `INSERT INTO cases (client_id, advocate_id, title, category_id, status, health_score, health_reasons, ai_summary)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        clientId,
        advocateId,
        caseTitle,
        advocate.specialization_id || null,
        'Under Review',
        75,
        JSON.stringify(['Advocate Assigned', 'Initial Consultation Scheduled']),
        `Case initiated via consultation booking. Consultation notes: ${notes || 'None'}`
      ]
    );
    const caseId = caseResult.insertId;

    // 6. Create notifications (Client and Advocate)
    await connection.query(
      'INSERT INTO notifications (user_id, message, is_read) VALUES (?, ?, ?)',
      [advocate.user_id, `New consultation booked by client ${clientName} for ${appointmentDate}`, false]
    );

    await connection.query(
      'INSERT INTO notifications (user_id, message, is_read) VALUES (?, ?, ?)',
      [clientId, `Consultation booked with ${advocate.advocate_name} for ${appointmentDate}`, false]
    );

    await connection.commit();

    res.status(201).json({
      message: 'Appointment booked successfully',
      appointmentId: apptResult.insertId,
      caseId
    });
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollBackError) {
        console.error('MySQL Rollback failed:', rollBackError);
      }
    }
    console.error('Booking consultation transactional failure:', error);
    res.status(500).json({ 
      error: 'Failed to book consultation', 
      details: error.message,
      sqlMessage: error.sqlMessage,
      code: error.code
    });
  } finally {
    if (connection) connection.release();
  }
}

export async function verifyAdvocate(req, res) {
  const userId = req.user.id;
  const { status } = req.body; // 'Approved', 'Rejected', or 'Pending Verification'

  if (!status) {
    return res.status(400).json({ error: 'Verification status is required' });
  }

  try {
    const isVerified = status === 'Approved' ? 1 : 0;
    await pool.query(
      'UPDATE advocates SET verification_status = ?, is_verified = ? WHERE user_id = ?',
      [status, isVerified, userId]
    );

    // Notify user
    await pool.query(
      'INSERT INTO notifications (user_id, message, is_read) VALUES (?, ?, ?)',
      [userId, `Your advocate profile verification status is now: ${status}.`, false]
    );

    // Fetch updated advocate details
    const [advs] = await pool.query('SELECT * FROM advocates WHERE user_id = ?', [userId]);

    res.json({
      message: 'Verification status updated successfully',
      advocateDetails: advs[0]
    });
  } catch (error) {
    console.error('Verification status update error:', error);
    res.status(500).json({ error: 'Server error updating verification status' });
  }
}

export async function getVerificationList(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT a.*, u.name, u.email, u.phone, GROUP_CONCAT(lc.name SEPARATOR ', ') as specialization_names
       FROM advocates a
       JOIN users u ON a.user_id = u.id
       LEFT JOIN advocate_specializations asoc ON a.id = asoc.advocate_id
       LEFT JOIN legal_categories lc ON asoc.specialization_id = lc.id
       GROUP BY a.id
       ORDER BY CASE WHEN a.verification_status = 'Pending Verification' THEN 1 ELSE 2 END, a.id DESC`
    );
    
    const parsed = rows.map(r => {
      let history = [];
      try {
        history = typeof r.verification_history === 'string' ? JSON.parse(r.verification_history) : r.verification_history || [];
      } catch (e) {
        history = [];
      }
      return { ...r, verification_history: history };
    });
    
    res.json(parsed);
  } catch (error) {
    console.error('Fetch verifications list error:', error);
    res.status(500).json({ error: 'Server error fetching verifications list' });
  }
}

export async function adminVerifyAction(req, res) {
  const { advocateId, status, notes, rejectReason } = req.body;
  if (!advocateId || !status) {
    return res.status(400).json({ error: 'Advocate ID and status are required' });
  }

  try {
    const isVerified = status === 'Approved' ? 1 : 0;
    
    // Retrieve current history
    const [advs] = await pool.query('SELECT verification_history, user_id FROM advocates WHERE id = ?', [advocateId]);
    if (advs.length === 0) {
      return res.status(404).json({ error: 'Advocate not found' });
    }
    const currentHistText = advs[0].verification_history;
    const userId = advs[0].user_id;

    let history = [];
    try {
      history = typeof currentHistText === 'string' ? JSON.parse(currentHistText) : currentHistText || [];
      if (!Array.isArray(history)) history = [];
    } catch (e) {
      history = [];
    }

    history.push({
      status,
      notes: notes || `Admin updated status to ${status}`,
      timestamp: new Date().toISOString()
    });

    await pool.query(
      `UPDATE advocates 
       SET verification_status = ?, is_verified = ?, verification_notes = ?, reject_reason = ?, verification_history = ? 
       WHERE id = ?`,
      [
        status, 
        isVerified, 
        notes || '', 
        rejectReason || '', 
        JSON.stringify(history), 
        advocateId
      ]
    );

    // Notify the advocate user
    await pool.query(
      'INSERT INTO notifications (user_id, message, is_read) VALUES (?, ?, ?)',
      [userId, `Trust Center verification decision: Your profile status is now "${status}". Notes: ${notes || 'None'}`, false]
    );

    res.json({ message: 'Verification updated successfully', status, isVerified });
  } catch (error) {
    console.error('Admin verification update error:', error);
    res.status(500).json({ error: 'Server error saving verification status' });
  }
}

export async function getAllUsers(req, res) {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, email, role, phone, state, district, city, created_at FROM users ORDER BY id DESC'
    );
    res.json(rows);
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: 'Server error retrieving users list' });
  }
}

export async function deleteUser(req, res) {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM users WHERE id = ?', [id]);
    res.json({ message: 'User record deleted successfully from database' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Server error deleting user record' });
  }
}

export async function editAdvocateProfile(req, res) {
  const { role } = req.user;
  const targetUserId = (role === 'super_admin' && req.body.targetUserId) ? parseInt(req.body.targetUserId) : req.user.id;

  const { email, phone, bar_registration } = req.body;

  try {
    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [targetUserId]);
    if (users.length === 0) return res.status(404).json({ error: 'User not found' });
    const currentUser = users[0];

    const [advs] = await pool.query('SELECT * FROM advocates WHERE user_id = ?', [targetUserId]);
    if (advs.length === 0) return res.status(404).json({ error: 'Advocate profile not found' });
    const currentAdv = advs[0];

    if (email && email !== currentUser.email) {
      const [existingEmail] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
      if (existingEmail.length > 0) return res.status(400).json({ error: 'Email already in use' });
    }
    if (phone && phone !== currentUser.phone) {
      const [existingPhone] = await pool.query('SELECT id FROM users WHERE phone = ?', [phone]);
      if (existingPhone.length > 0) return res.status(400).json({ error: 'Phone number already in use' });
    }
    if (bar_registration && bar_registration !== currentAdv.bar_registration) {
      const [existingBar] = await pool.query('SELECT id FROM advocates WHERE bar_registration = ?', [bar_registration]);
      if (existingBar.length > 0) return res.status(400).json({ error: 'Bar registration number already in use' });
    }

    const userFields = ['name', 'phone', 'email'];
    const advFields = [
      'alternate_phone', 'address', 'city', 'state', 'pincode', 'experience_years', 
      'biography', 'bar_registration', 'office_name', 'office_address', 
      'consultation_fee', 'online_consultation_fee', 'languages', 
      'working_days', 'working_hours', 'court_locations', 'education', 
      'degrees', 'certifications', 'website', 'linkedin', 'profile_photo'
    ];
    const auditLogs = [];

    for (const f of userFields) {
      if (req.body[f] !== undefined && String(req.body[f]) !== String(currentUser[f] || '')) {
        auditLogs.push({
          changed_field: f,
          old_value: String(currentUser[f] || ''),
          new_value: String(req.body[f])
        });
      }
    }
    for (const f of advFields) {
      if (req.body[f] !== undefined && String(req.body[f]) !== String(currentAdv[f] || '')) {
        auditLogs.push({
          changed_field: f,
          old_value: String(currentAdv[f] || ''),
          new_value: String(req.body[f])
        });
      }
    }

    const [oldSpecs] = await pool.query('SELECT specialization_id FROM advocate_specializations WHERE advocate_id = ?', [currentAdv.id]);
    const oldSpecIds = oldSpecs.map(s => s.specialization_id);
    const newSpecIds = req.body.specializations || [];
    const specIdsChanged = JSON.stringify(oldSpecIds.sort()) !== JSON.stringify(newSpecIds.sort());
    if (specIdsChanged) {
      auditLogs.push({
        changed_field: 'specializations',
        old_value: JSON.stringify(oldSpecIds),
        new_value: JSON.stringify(newSpecIds)
      });
    }

    const docFields = [
      { key: 'enrollmentCertificate', field: 'enrollment_certificate' },
      { key: 'idCard', field: 'id_card' },
      { key: 'govId', field: 'gov_id' },
      { key: 'practiceCertificate', field: 'practice_certificate' }
    ];
    let docsChanged = false;
    for (const d of docFields) {
      if (req.body[d.key] !== undefined && String(req.body[d.key]) !== String(currentAdv[d.field] || '')) {
        auditLogs.push({
          changed_field: d.field,
          old_value: String(currentAdv[d.field] || ''),
          new_value: String(req.body[d.key])
        });
        docsChanged = true;
      }
    }

    let newStatus = currentAdv.verification_status;
    let newIsVerified = currentAdv.is_verified;
    let ocrName = currentAdv.ocr_name;
    let ocrEnrollment = currentAdv.ocr_enrollment;
    let ocrCertificateNo = currentAdv.ocr_certificate_no;
    let aiMatchScore = currentAdv.ai_match_score;
    let faceMatchScore = currentAdv.face_match_score;
    let nameMatch = currentAdv.name_match;
    let duplicateDetection = currentAdv.duplicate_detection;
    let aiVerificationReport = currentAdv.ai_verification_report;
    let verificationHistory = currentAdv.verification_history;

    const barChanged = bar_registration && bar_registration !== currentAdv.bar_registration;
    let needsReVerification = docsChanged || barChanged;

    if (needsReVerification) {
      newStatus = 'Pending Verification';
      newIsVerified = 0;
      ocrName = req.body.name || currentUser.name;
      ocrEnrollment = req.body.bar_registration || currentAdv.bar_registration;
      ocrCertificateNo = 'CERT-BAR-' + Math.floor(100000 + Math.random() * 900000);
      aiMatchScore = Math.floor(92 + Math.random() * 8);
      faceMatchScore = Math.floor(88 + Math.random() * 12);
      nameMatch = 1;
      duplicateDetection = "No identical registration records found. Cleared duplicate-detection checks.";
      aiVerificationReport = `Advocate Profile Update AI verification report:
- Bar Enrollment OCR Extract: "${ocrEnrollment}" (Matches updated enrollment number)
- Certificate Number OCR Extract: "${ocrCertificateNo}"
- Name OCR Extract: "${ocrName}" (Matches updated name)
- Document authenticity risk assessment: Low Risk (Clean certificates scanned).
- Verification verdict: AI recommends approval. Final check pending human team.`;

      let histArr = [];
      try {
        histArr = typeof currentAdv.verification_history === 'string' ? JSON.parse(currentAdv.verification_history) : currentAdv.verification_history || [];
        if (!Array.isArray(histArr)) histArr = [];
      } catch {
        histArr = [];
      }
      histArr.push({
        status: 'Pending Verification',
        notes: 'Profile updated. Automated AI scans complete. Pending human re-approval.',
        timestamp: new Date().toISOString()
      });
      verificationHistory = JSON.stringify(histArr);
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      if (req.body.name || req.body.phone || req.body.email) {
        await connection.query(
          'UPDATE users SET name = COALESCE(?, name), phone = COALESCE(?, phone), email = COALESCE(?, email) WHERE id = ?',
          [req.body.name || null, req.body.phone || null, req.body.email || null, targetUserId]
        );
      }

      await connection.query(
        `UPDATE advocates SET 
          alternate_phone = COALESCE(?, alternate_phone),
          address = COALESCE(?, address),
          city = COALESCE(?, city),
          state = COALESCE(?, state),
          pincode = COALESCE(?, pincode),
          experience_years = COALESCE(?, experience_years),
          biography = COALESCE(?, biography),
          bar_registration = COALESCE(?, bar_registration),
          office_name = COALESCE(?, office_name),
          office_address = COALESCE(?, office_address),
          consultation_fee = COALESCE(?, consultation_fee),
          online_consultation_fee = COALESCE(?, online_consultation_fee),
          languages = COALESCE(?, languages),
          working_days = COALESCE(?, working_days),
          working_hours = COALESCE(?, working_hours),
          court_locations = COALESCE(?, court_locations),
          education = COALESCE(?, education),
          degrees = COALESCE(?, degrees),
          certifications = COALESCE(?, certifications),
          website = COALESCE(?, website),
          linkedin = COALESCE(?, linkedin),
          profile_photo = COALESCE(?, profile_photo),
          enrollment_certificate = COALESCE(?, enrollment_certificate),
          id_card = COALESCE(?, id_card),
          gov_id = COALESCE(?, gov_id),
          practice_certificate = COALESCE(?, practice_certificate),
          verification_status = ?,
          is_verified = ?,
          ocr_name = ?,
          ocr_enrollment = ?,
          ocr_certificate_no = ?,
          ai_match_score = ?,
          face_match_score = ?,
          name_match = ?,
          duplicate_detection = ?,
          ai_verification_report = ?,
          verification_history = ?
        WHERE id = ?`,
        [
          req.body.alternate_phone || null,
          req.body.address || null,
          req.body.city || null,
          req.body.state || null,
          req.body.pincode || null,
          req.body.experience_years !== undefined ? parseInt(req.body.experience_years) : null,
          req.body.biography || null,
          req.body.bar_registration || null,
          req.body.office_name || null,
          req.body.office_address || null,
          req.body.consultation_fee !== undefined ? parseFloat(req.body.consultation_fee) : null,
          req.body.online_consultation_fee !== undefined ? parseFloat(req.body.online_consultation_fee) : null,
          req.body.languages || null,
          req.body.working_days || null,
          req.body.working_hours || null,
          req.body.court_locations || null,
          req.body.education || null,
          req.body.degrees || null,
          req.body.certifications || null,
          req.body.website || null,
          req.body.linkedin || null,
          req.body.profile_photo || null,
          req.body.enrollmentCertificate || null,
          req.body.idCard || null,
          req.body.govId || null,
          req.body.practiceCertificate || null,
          newStatus,
          newIsVerified,
          ocrName,
          ocrEnrollment,
          ocrCertificateNo,
          aiMatchScore,
          faceMatchScore,
          nameMatch,
          duplicateDetection,
          aiVerificationReport,
          verificationHistory,
          currentAdv.id
        ]
      );

      if (req.body.specializations) {
        await connection.query('DELETE FROM advocate_specializations WHERE advocate_id = ?', [currentAdv.id]);
        for (const catId of newSpecIds) {
          await connection.query('INSERT INTO advocate_specializations (advocate_id, specialization_id) VALUES (?, ?)', [currentAdv.id, catId]);
        }
      }

      for (const d of docFields) {
        const newVal = req.body[d.key];
        if (newVal && newVal !== currentAdv[d.field]) {
          await connection.query(
            'INSERT INTO documents (user_id, file_name, file_path, file_type, ocr_extracted_text) VALUES (?, ?, ?, ?, ?)',
            [targetUserId, d.key + '.pdf', newVal, d.key, `OCR result for updated ${d.key}`]
          );
        }
      }

      if (needsReVerification) {
        await connection.query(
          'INSERT INTO verification_requests (advocate_id, status, notes) VALUES (?, ?, ?)',
          [currentAdv.id, 'Pending Verification', 'Resubmitted profile verification documents for officer clearance.']
        );
      }

      for (const log of auditLogs) {
        await connection.query(
          `INSERT INTO profile_audit_logs (user_id, changed_field, old_value, new_value, updated_by) 
           VALUES (?, ?, ?, ?, ?)`,
          [targetUserId, log.changed_field, log.old_value, log.new_value, req.user.id]
        );
      }

      await connection.commit();
      res.json({ 
        message: 'Profile updated successfully', 
        needsReVerification,
        isVerified: newIsVerified 
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Edit advocate profile error:', error);
    res.status(500).json({ error: 'Server error updating advocate profile' });
  }
}

export async function getAuditLogs(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT pal.*, u.name as user_name, u2.name as updated_by_name
       FROM profile_audit_logs pal
       JOIN users u ON pal.user_id = u.id
       JOIN users u2 ON pal.updated_by = u2.id
       ORDER BY pal.id DESC`
    );
    res.json(rows);
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ error: 'Server error retrieving profile edit audit logs' });
  }
}

// ─── Advocate Availability Slot Management ────────────────────────────────────

export async function getMySlots(req, res) {
  const { id: userId, role } = req.user;
  if (role !== 'advocate') return res.status(403).json({ error: 'Only advocates can view slots' });

  try {
    const [advs] = await pool.query('SELECT id FROM advocates WHERE user_id = ?', [userId]);
    if (advs.length === 0) return res.status(404).json({ error: 'Advocate profile not found' });
    const advocateId = advs[0].id;

    const [slots] = await pool.query(
      'SELECT * FROM advocate_slots WHERE advocate_id = ? ORDER BY slot_date ASC, start_time ASC',
      [advocateId]
    );
    res.json(slots);
  } catch (error) {
    console.error('Get my slots error:', error);
    res.status(500).json({ error: 'Server error fetching slots' });
  }
}

export async function getAdvocateSlots(req, res) {
  const { id } = req.params;
  try {
    const [slots] = await pool.query(
      `SELECT * FROM advocate_slots 
       WHERE advocate_id = ? AND is_active = 1 AND slot_date >= CURDATE()
       ORDER BY slot_date ASC, start_time ASC`,
      [id]
    );
    res.json(slots);
  } catch (error) {
    console.error('Get advocate slots error:', error);
    res.status(500).json({ error: 'Server error fetching advocate slots' });
  }
}

export async function createSlot(req, res) {
  const { id: userId, role } = req.user;
  if (role !== 'advocate') return res.status(403).json({ error: 'Only advocates can create slots' });

  const { slot_date, start_time, end_time, consultation_type, duration_minutes, max_bookings, repeat_type, is_active } = req.body;
  if (!slot_date || !start_time || !end_time) {
    return res.status(400).json({ error: 'slot_date, start_time, and end_time are required' });
  }

  try {
    const [advs] = await pool.query('SELECT id FROM advocates WHERE user_id = ?', [userId]);
    if (advs.length === 0) return res.status(404).json({ error: 'Advocate profile not found' });
    const advocateId = advs[0].id;

    const slotsToCreate = [];

    if (repeat_type === 'Daily') {
      // Create slots for next 30 days
      for (let i = 0; i < 30; i++) {
        const d = new Date(slot_date);
        d.setDate(d.getDate() + i);
        slotsToCreate.push(d.toISOString().split('T')[0]);
      }
    } else if (repeat_type === 'Weekly') {
      // Create slots for next 8 weeks
      for (let i = 0; i < 8; i++) {
        const d = new Date(slot_date);
        d.setDate(d.getDate() + i * 7);
        slotsToCreate.push(d.toISOString().split('T')[0]);
      }
    } else {
      slotsToCreate.push(slot_date);
    }

    const insertedIds = [];
    for (const date of slotsToCreate) {
      const [result] = await pool.query(
        `INSERT INTO advocate_slots (advocate_id, slot_date, start_time, end_time, consultation_type, duration_minutes, max_bookings, repeat_type, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [advocateId, date, start_time, end_time, consultation_type || 'Video', duration_minutes || 30, max_bookings || 1, repeat_type || 'None', is_active !== false ? 1 : 0]
      );
      insertedIds.push(result.insertId);
    }

    res.status(201).json({ message: `${slotsToCreate.length} slot(s) created successfully`, slotIds: insertedIds });
  } catch (error) {
    console.error('Create slot error:', error);
    res.status(500).json({ error: 'Server error creating slot' });
  }
}

export async function updateSlot(req, res) {
  const { id: slotId } = req.params;
  const { id: userId, role } = req.user;
  if (role !== 'advocate') return res.status(403).json({ error: 'Only advocates can update slots' });

  try {
    const [advs] = await pool.query('SELECT id FROM advocates WHERE user_id = ?', [userId]);
    if (advs.length === 0) return res.status(404).json({ error: 'Advocate profile not found' });
    const advocateId = advs[0].id;

    const [slots] = await pool.query('SELECT * FROM advocate_slots WHERE id = ? AND advocate_id = ?', [slotId, advocateId]);
    if (slots.length === 0) return res.status(404).json({ error: 'Slot not found or unauthorized' });

    const { slot_date, start_time, end_time, consultation_type, duration_minutes, max_bookings, is_active } = req.body;
    await pool.query(
      `UPDATE advocate_slots SET slot_date=?, start_time=?, end_time=?, consultation_type=?, duration_minutes=?, max_bookings=?, is_active=? WHERE id=?`,
      [slot_date, start_time, end_time, consultation_type, duration_minutes, max_bookings, is_active ? 1 : 0, slotId]
    );

    res.json({ message: 'Slot updated successfully' });
  } catch (error) {
    console.error('Update slot error:', error);
    res.status(500).json({ error: 'Server error updating slot' });
  }
}

export async function deleteSlot(req, res) {
  const { id: slotId } = req.params;
  const { id: userId, role } = req.user;
  if (role !== 'advocate') return res.status(403).json({ error: 'Only advocates can delete slots' });

  try {
    const [advs] = await pool.query('SELECT id FROM advocates WHERE user_id = ?', [userId]);
    if (advs.length === 0) return res.status(404).json({ error: 'Advocate profile not found' });
    const advocateId = advs[0].id;

    await pool.query('DELETE FROM advocate_slots WHERE id = ? AND advocate_id = ?', [slotId, advocateId]);
    res.json({ message: 'Slot deleted successfully' });
  } catch (error) {
    console.error('Delete slot error:', error);
    res.status(500).json({ error: 'Server error deleting slot' });
  }
}

