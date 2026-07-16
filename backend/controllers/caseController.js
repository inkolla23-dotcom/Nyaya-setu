import pool from '../config/db.js';
import { explainHearing, checkDocument, explainWhatNext } from '../services/aiService.js';

export async function getCases(req, res) {
  const { id, role } = req.user;

  try {
    let query = '';
    let params = [];

    if (role === 'advocate') {
      // Find advocate table ID first
      const [advs] = await pool.query('SELECT id FROM advocates WHERE user_id = ?', [id]);
      if (advs.length === 0) {
        return res.status(404).json({ error: 'Advocate profile not found' });
      }
      const advocateId = advs[0].id;

      query = `
        SELECT c.*, u.name as client_name, lc.name as category_name
        FROM cases c
        JOIN users u ON c.client_id = u.id
        LEFT JOIN legal_categories lc ON c.category_id = lc.id
        WHERE c.advocate_id = ?
        ORDER BY c.created_at DESC
      `;
      params = [advocateId];
    } else {
      // Client
      query = `
        SELECT c.*, u.name as advocate_name, lc.name as category_name
        FROM cases c
        JOIN advocates a ON c.advocate_id = a.id
        JOIN users u ON a.user_id = u.id
        LEFT JOIN legal_categories lc ON c.category_id = lc.id
        WHERE c.client_id = ?
        ORDER BY c.created_at DESC
      `;
      params = [id];
    }

    const [cases] = await pool.query(query, params);
    res.json(cases);
  } catch (error) {
    console.error('Fetch cases error:', error);
    res.status(500).json({ error: 'Server error fetching cases' });
  }
}

export async function getCaseById(req, res) {
  const { id } = req.params;

  try {
    // Fetch case info
    const [cases] = await pool.query(`
      SELECT c.*, 
             uc.name as client_name, uc.email as client_email, uc.phone as client_phone,
             ua.name as advocate_name, ua.email as advocate_email, ua.phone as advocate_phone, a.profile_photo as advocate_photo,
             lc.name as category_name
      FROM cases c
      JOIN users uc ON c.client_id = uc.id
      JOIN advocates a ON c.advocate_id = a.id
      JOIN users ua ON a.user_id = ua.id
      LEFT JOIN legal_categories lc ON c.category_id = lc.id
      WHERE c.id = ?
    `, [id]);

    if (cases.length === 0) {
      return res.status(404).json({ error: 'Case not found' });
    }

    const caseData = cases[0];

    // Fetch updates
    const [updates] = await pool.query(`
      SELECT * FROM case_updates WHERE case_id = ? ORDER BY update_date DESC, id DESC
    `, [id]);

    // Fetch documents
    const [documents] = await pool.query(`
      SELECT * FROM documents WHERE case_id = ? ORDER BY uploaded_at DESC
    `, [id]);

    // Fetch appointments
    const [appointments] = await pool.query(`
      SELECT ap.*, ua.name as advocate_name, uc.name as client_name
      FROM appointments ap
      JOIN users uc ON ap.client_id = uc.id
      JOIN advocates a ON ap.advocate_id = a.id
      JOIN users ua ON a.user_id = ua.id
      WHERE ap.client_id = ? AND ap.advocate_id = ?
      ORDER BY ap.appointment_date DESC
    `, [caseData.client_id, caseData.advocate_id]);

    res.json({
      ...caseData,
      updates,
      documents,
      appointments
    });
  } catch (error) {
    console.error('Fetch case detail error:', error);
    res.status(500).json({ error: 'Server error fetching case details' });
  }
}

export async function createCase(req, res) {
  const { clientId, title, categoryId, status, nextHearingDate } = req.body;
  const advocateUser = req.user;

  if (advocateUser.role !== 'advocate') {
    return res.status(403).json({ error: 'Only advocates can create cases' });
  }

  if (!clientId || !title) {
    return res.status(400).json({ error: 'Client ID and Case Title are required' });
  }

  try {
    // Get advocate ID
    const [advs] = await pool.query('SELECT id FROM advocates WHERE user_id = ?', [advocateUser.id]);
    if (advs.length === 0) {
      return res.status(404).json({ error: 'Advocate profile not found' });
    }
    const advocateId = advs[0].id;

    const healthReasons = JSON.stringify(['Advocate Assigned', 'Case Dashboard Created']);
    const healthScore = 80;

    const [result] = await pool.query(
      `INSERT INTO cases (client_id, advocate_id, title, category_id, status, health_score, health_reasons, next_hearing_date) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [clientId, advocateId, title, categoryId || null, status || 'Under Review', healthScore, healthReasons, nextHearingDate || null]
    );

    // Initial Case Update
    await pool.query(
      `INSERT INTO case_updates (case_id, update_date, title, description, ai_explanation, stage)
       VALUES (?, CURRENT_TIMESTAMP, ?, ?, ?, ?)`,
      [result.insertId, 'Case Registered', 'Case dashboard initialized on Nyaya Setu.', 'Your case file has been created. A digital dashboard is now active for monitoring progress.', 'Onboarding']
    );

    // Notify client
    await pool.query(
      'INSERT INTO notifications (user_id, message, is_read) VALUES (?, ?, ?)',
      [clientId, `A new case "${title}" has been registered by Adv. ${advocateUser.name}.`, false]
    );

    res.status(201).json({
      message: 'Case created successfully',
      caseId: result.insertId
    });
  } catch (error) {
    console.error('Create case error:', error);
    res.status(500).json({ error: 'Server error creating case' });
  }
}

export async function addCaseUpdate(req, res) {
  const { caseId, title, description, stage, nextHearingDate } = req.body;
  const { id: userId, name: userName, role } = req.user;

  if (role !== 'advocate') {
    return res.status(403).json({ error: 'Only advocates can post case updates' });
  }

  if (!caseId || !title || !description) {
    return res.status(400).json({ error: 'Case ID, title, and description are required' });
  }

  try {
    // Check if case belongs to advocate
    const [advs] = await pool.query('SELECT id FROM advocates WHERE user_id = ?', [userId]);
    if (advs.length === 0) {
      return res.status(404).json({ error: 'Advocate profile not found' });
    }
    const advocateId = advs[0].id;

    const [cases] = await pool.query('SELECT client_id FROM cases WHERE id = ? AND advocate_id = ?', [caseId, advocateId]);
    if (cases.length === 0) {
      return res.status(404).json({ error: 'Case not found or unauthorized' });
    }
    const caseItem = cases[0];

    // Call AI Hearing Explainer to translate description
    const aiExplanation = await explainHearing(description, 'en'); // default to English

    // Insert update
    await pool.query(
      `INSERT INTO case_updates (case_id, update_date, title, description, ai_explanation, stage)
       VALUES (?, CURRENT_TIMESTAMP, ?, ?, ?, ?)`,
      [caseId, title, description, aiExplanation, stage || 'Ongoing']
    );

    // Update case status and next hearing date if provided
    let updateCaseQuery = 'UPDATE cases SET status = ?';
    const updateCaseParams = [title];

    if (nextHearingDate) {
      updateCaseQuery += ', next_hearing_date = ?';
      updateCaseParams.push(nextHearingDate);
    }
    updateCaseQuery += ' WHERE id = ?';
    updateCaseParams.push(caseId);

    await pool.query(updateCaseQuery, updateCaseParams);

    // Notify client
    await pool.query(
      'INSERT INTO notifications (user_id, message, is_read) VALUES (?, ?, ?)',
      [caseItem.client_id, `Case Update: "${title}" posted by Adv. ${userName}.`, false]
    );

    res.status(201).json({
      message: 'Case update posted successfully',
      aiExplanation
    });
  } catch (error) {
    console.error('Add case update failure:', error.message);
    res.status(503).json({ error: 'Nyaya Copilot is temporarily unavailable. Please try again in a few moments.' });
  }
}

export async function uploadDocument(req, res) {
  const { caseId, fileName, fileType, textContent, language } = req.body;
  const userId = req.user.id;

  if (!fileName || !fileType) {
    return res.status(400).json({ error: 'File name and file type are required' });
  }

  try {
    // Generate AI Summary of the document
    const textToAnalyze = textContent || `Sample content for file ${fileName} of type ${fileType}`;
    const aiAnalysis = await checkDocument(fileName, fileType, textToAnalyze, language || 'en');

    // Insert document record
    const [result] = await pool.query(
      `INSERT INTO documents (case_id, user_id, file_name, file_type, summary, key_points, difficult_words, missing_documents) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        caseId || null,
        userId,
        fileName,
        fileType,
        aiAnalysis.summary,
        JSON.stringify(aiAnalysis.keyPoints),
        JSON.stringify(aiAnalysis.difficultWords),
        JSON.stringify(aiAnalysis.missingDocuments)
      ]
    );

    // If case ID was provided, update Case Health Score
    if (caseId) {
      const [cases] = await pool.query('SELECT health_score, health_reasons FROM cases WHERE id = ?', [caseId]);
      if (cases.length > 0) {
        let score = Math.min(100, cases[0].health_score + 5);
        let reasons = [];
        try {
          reasons = JSON.parse(cases[0].health_reasons || '[]');
        } catch (e) {
          reasons = [];
        }

        const docUploadedMsg = `Document ${fileType} Uploaded`;
        if (!reasons.includes(docUploadedMsg)) {
          reasons.push(docUploadedMsg);
          // Remove "One Document Missing" if it exists
          const index = reasons.indexOf('One Document Missing');
          if (index > -1) {
            reasons.splice(index, 1);
            score = Math.min(100, score + 10);
          }
          await pool.query('UPDATE cases SET health_score = ?, health_reasons = ? WHERE id = ?', [score, JSON.stringify(reasons), caseId]);
        }
      }
    }

    res.status(201).json({
      message: 'Document uploaded and analyzed successfully',
      document: {
        id: result.insertId,
        fileName,
        fileType,
        summary: aiAnalysis.summary,
        keyPoints: aiAnalysis.keyPoints,
        difficultWords: aiAnalysis.difficultWords,
        missingDocuments: aiAnalysis.missingDocuments
      }
    });
  } catch (error) {
    console.error('Upload document failure:', error.message);
    res.status(503).json({ error: 'Nyaya Copilot is temporarily unavailable. Please try again in a few moments.' });
  }
}

export async function getAppointments(req, res) {
  const { id, role } = req.user;

  try {
    let query = '';
    let params = [];

    if (role === 'advocate') {
      const [advs] = await pool.query('SELECT id FROM advocates WHERE user_id = ?', [id]);
      if (advs.length === 0) {
        return res.status(404).json({ error: 'Advocate profile not found' });
      }
      const advocateId = advs[0].id;

      query = `
        SELECT ap.*, u.name as client_name, u.email as client_email, u.phone as client_phone,
               rs.slot_date as reschedule_slot_date, rs.start_time as reschedule_start_time,
               rs.end_time as reschedule_end_time, rs.consultation_type as reschedule_consultation_type,
               rs.duration_minutes as reschedule_duration_minutes
        FROM appointments ap
        JOIN users u ON ap.client_id = u.id
        LEFT JOIN advocate_slots rs ON ap.reschedule_slot_id = rs.id
        WHERE ap.advocate_id = ?
        ORDER BY ap.appointment_date DESC
      `;
      params = [advocateId];
    } else if (role === 'super_admin') {
      query = `
        SELECT ap.*, uc.name as client_name, uc.email as client_email, 
               ua.name as advocate_name, ua.email as advocate_email,
               rs.slot_date as reschedule_slot_date, rs.start_time as reschedule_start_time,
               rs.end_time as reschedule_end_time, rs.consultation_type as reschedule_consultation_type,
               rs.duration_minutes as reschedule_duration_minutes
        FROM appointments ap
        JOIN users uc ON ap.client_id = uc.id
        JOIN advocates a ON ap.advocate_id = a.id
        JOIN users ua ON a.user_id = ua.id
        LEFT JOIN advocate_slots rs ON ap.reschedule_slot_id = rs.id
        ORDER BY ap.appointment_date DESC
      `;
      params = [];
    } else {
      // Client
      query = `
        SELECT ap.*, ua.name as advocate_name, ua.phone as advocate_phone, a.location as advocate_location, a.profile_photo as advocate_photo,
               rs.slot_date as reschedule_slot_date, rs.start_time as reschedule_start_time,
               rs.end_time as reschedule_end_time, rs.consultation_type as reschedule_consultation_type,
               rs.duration_minutes as reschedule_duration_minutes
        FROM appointments ap
        JOIN advocates a ON ap.advocate_id = a.id
        JOIN users ua ON a.user_id = ua.id
        LEFT JOIN advocate_slots rs ON ap.reschedule_slot_id = rs.id
        WHERE ap.client_id = ?
        ORDER BY ap.appointment_date DESC
      `;
      params = [id];
    }

    const [appointments] = await pool.query(query, params);
    res.json(appointments);
  } catch (error) {
    console.error('Fetch appointments error:', error);
    res.status(500).json({ error: 'Server error fetching appointments' });
  }
}

export async function getWhatHappensNext(req, res) {
  const { caseId } = req.params;
  const { language } = req.query;

  try {
    const [cases] = await pool.query('SELECT title, status FROM cases WHERE id = ?', [caseId]);
    if (cases.length === 0) {
      return res.status(404).json({ error: 'Case not found' });
    }
    const c = cases[0];

    const nextInfo = await explainWhatNext(c.title, c.status, language || 'en');
    res.json(nextInfo);
  } catch (error) {
    console.error('Get what happens next failure:', error.message);
    res.status(503).json({ error: 'Nyaya Copilot is temporarily unavailable. Please try again in a few moments.' });
  }
}

export async function getNotifications(req, res) {
  const userId = req.user.id;
  try {
    const [rows] = await pool.query(
      'SELECT id, message, is_read as isRead, created_at as createdAt FROM notifications WHERE user_id = ? ORDER BY id DESC LIMIT 50',
      [userId]
    );
    res.json(rows);
  } catch (error) {
    console.error('Fetch notifications error:', error);
    res.status(500).json({ error: 'Server error fetching notifications' });
  }
}

export async function markNotificationsRead(req, res) {
  const userId = req.user.id;
  try {
    await pool.query('UPDATE notifications SET is_read = TRUE WHERE user_id = ?', [userId]);
    res.json({ message: 'Notifications marked as read' });
  } catch (error) {
    console.error('Mark notifications read error:', error);
    res.status(500).json({ error: 'Server error updating notifications' });
  }
}

export async function acceptAppointment(req, res) {
  const { id } = req.params;
  const { role, id: userId } = req.user;

  if (role !== 'advocate') {
    return res.status(403).json({ error: 'Only advocates can accept appointments' });
  }

  try {
    const [advs] = await pool.query('SELECT id FROM advocates WHERE user_id = ?', [userId]);
    if (advs.length === 0) {
      return res.status(404).json({ error: 'Advocate profile not found' });
    }
    const advocateId = advs[0].id;

    const [appts] = await pool.query('SELECT * FROM appointments WHERE id = ? AND advocate_id = ?', [id, advocateId]);
    if (appts.length === 0) {
      return res.status(404).json({ error: 'Appointment no longer exists.' });
    }
    const appt = appts[0];

    // If client requested another slot and advocate accepts, use the requested reschedule slot details!
    let useDate = appt.appointment_date;
    let useDuration = appt.duration_minutes;
    let useType = appt.consultation_type;
    let useSlotId = appt.slot_id;

    if (appt.reschedule_slot_id && appt.reschedule_status === 'PENDING_ADVOCATE') {
      const [slots] = await pool.query('SELECT * FROM advocate_slots WHERE id = ?', [appt.reschedule_slot_id]);
      if (slots.length > 0) {
        const slot = slots[0];
        const datePart = new Date(slot.slot_date).toISOString().split('T')[0];
        useDate = `${datePart} ${slot.start_time}`;
        useDuration = slot.duration_minutes;
        useType = slot.consultation_type;
        useSlotId = slot.id;
      }
    }

    let meetingLink = null;
    let meetingStatus = 'FAILED';
    const simulateFailure = req.body.simulateFailure === true;

    if (!simulateFailure) {
      const p1 = Math.random().toString(36).substring(2, 5);
      const p2 = Math.random().toString(36).substring(2, 6);
      const p3 = Math.random().toString(36).substring(2, 5);
      meetingLink = `https://meet.google.com/${p1}-${p2}-${p3}`;
      meetingStatus = 'CREATED';
    }

    await pool.query(
      `UPDATE appointments SET 
        status = 'scheduled',
        appointment_date = ?,
        duration_minutes = ?,
        consultation_type = ?,
        slot_id = ?,
        reschedule_slot_id = NULL,
        reschedule_status = 'ACCEPTED',
        meeting_link = ?, 
        meeting_provider = ?, 
        meeting_status = ?, 
        meeting_created_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [useDate, useDuration, useType, useSlotId, meetingLink, meetingLink ? 'GOOGLE_MEET' : null, meetingStatus, id]
    );

    // Notify the client
    await pool.query(
      'INSERT INTO notifications (user_id, message, is_read) VALUES (?, ?, ?)',
      [appt.client_id, `Your consultation on ${useDate ? new Date(useDate).toLocaleDateString() : 'the scheduled date'} has been accepted by the advocate.${meetingLink ? ' Google Meet link: ' + meetingLink : ''}`, false]
    );

    res.json({ 
      message: meetingLink ? 'Appointment accepted and meeting link created' : 'Meeting link is being prepared. Please refresh in a few moments.',
      meeting_link: meetingLink,
      meeting_status: meetingStatus
    });
  } catch (error) {
    console.error('Accept appointment error:', error);
    res.status(500).json({ error: 'Server error accepting appointment' });
  }
}

export async function completeAppointment(req, res) {
  const { id } = req.params;
  const { role, id: userId } = req.user;

  try {
    let apptCheckQuery = '';
    let params = [];
    if (role === 'advocate') {
      const [advs] = await pool.query('SELECT id FROM advocates WHERE user_id = ?', [userId]);
      if (advs.length === 0) return res.status(404).json({ error: 'Advocate profile not found' });
      apptCheckQuery = 'SELECT * FROM appointments WHERE id = ? AND advocate_id = ?';
      params = [id, advs[0].id];
    } else {
      apptCheckQuery = 'SELECT * FROM appointments WHERE id = ? AND client_id = ?';
      params = [id, userId];
    }

    const [appts] = await pool.query(apptCheckQuery, params);
    if (appts.length === 0) return res.status(404).json({ error: 'Appointment not found or unauthorized' });

    await pool.query("UPDATE appointments SET status = 'completed' WHERE id = ?", [id]);
    res.json({ message: 'Appointment marked as completed' });
  } catch (error) {
    console.error('Complete appointment error:', error);
    res.status(500).json({ error: 'Server error completing appointment' });
  }
}

export async function rejectAppointment(req, res) {
  const { id } = req.params;
  const { role, id: userId } = req.user;
  const { rejection_reason } = req.body;

  if (role !== 'advocate') {
    return res.status(403).json({ error: 'Only advocates can reject appointments' });
  }

  try {
    const [advs] = await pool.query('SELECT id FROM advocates WHERE user_id = ?', [userId]);
    if (advs.length === 0) return res.status(404).json({ error: 'Advocate profile not found' });
    const advocateId = advs[0].id;

    const [appts] = await pool.query('SELECT * FROM appointments WHERE id = ? AND advocate_id = ?', [id, advocateId]);
    if (appts.length === 0) return res.status(404).json({ error: 'Appointment no longer exists.' });

    const appt = appts[0];

    await pool.query(
      `UPDATE appointments SET status = 'cancelled', rejection_reason = ? WHERE id = ?`,
      [rejection_reason || 'Advocate unavailable', id]
    );

    // Notify the client
    await pool.query(
      'INSERT INTO notifications (user_id, message, is_read) VALUES (?, ?, ?)',
      [appt.client_id, `Your consultation request has been declined by the advocate. Reason: ${rejection_reason || 'Advocate unavailable'}. Please choose another slot.`, false]
    );

    res.json({ message: 'Appointment rejected and client notified' });
  } catch (error) {
    console.error('Reject appointment error:', error);
    res.status(500).json({ error: 'Server error rejecting appointment' });
  }
}

export async function rescheduleAppointment(req, res) {
  const { id } = req.params;
  const { role, id: userId } = req.user;
  const { reschedule_slot_id, reschedule_reason } = req.body;

  if (role !== 'advocate') {
    return res.status(403).json({ error: 'Only advocates can propose reschedules' });
  }

  const apptId = parseInt(id, 10);
  if (isNaN(apptId)) {
    return res.status(400).json({ error: 'Invalid appointment ID.' });
  }

  const slotId = parseInt(reschedule_slot_id, 10);
  if (isNaN(slotId)) {
    return res.status(400).json({ error: 'Invalid or missing reschedule slot ID.' });
  }

  try {
    const [advs] = await pool.query('SELECT id FROM advocates WHERE user_id = ?', [userId]);
    if (advs.length === 0) return res.status(404).json({ error: 'Advocate profile not found' });
    const advocateId = advs[0].id;

    const [appts] = await pool.query('SELECT * FROM appointments WHERE id = ?', [apptId]);
    if (appts.length === 0) return res.status(404).json({ error: 'Appointment no longer exists.' });
    const appt = appts[0];

    if (appt.advocate_id !== advocateId) {
      return res.status(403).json({ error: 'You are not authorized to reschedule this appointment.' });
    }

    const [slots] = await pool.query('SELECT * FROM advocate_slots WHERE id = ? AND advocate_id = ?', [slotId, advocateId]);
    if (slots.length === 0) return res.status(404).json({ error: 'No available slot found.' });
    const slot = slots[0];

    if (!slot.is_active) {
      return res.status(400).json({ error: 'The selected slot is currently inactive.' });
    }

    // Verify slot availability (max_bookings)
    const [bookings] = await pool.query(
      "SELECT COUNT(*) as count FROM appointments WHERE slot_id = ? AND status IN ('scheduled', 'pending') AND id != ?",
      [slotId, apptId]
    );
    if (bookings[0].count >= slot.max_bookings) {
      return res.status(400).json({ error: 'Slot already booked.' });
    }

    await pool.query(
      `UPDATE appointments SET reschedule_slot_id = ?, reschedule_status = 'PENDING_CLIENT', reschedule_reason = ? WHERE id = ?`,
      [slotId, reschedule_reason || 'Advocate unavailable at previous time.', apptId]
    );

    // Notify the client
    const datePart = new Date(slot.slot_date).toISOString().split('T')[0];
    await pool.query(
      'INSERT INTO notifications (user_id, message, is_read) VALUES (?, ?, ?)',
      [appt.client_id, `Your advocate has suggested a new consultation slot: ${datePart} at ${slot.start_time} (${slot.consultation_type}). Please accept or decline.`, false]
    );

    res.json({ message: 'Reschedule request sent successfully.', slot });
  } catch (error) {
    console.error('Reschedule appointment error:', error);
    res.status(500).json({ error: 'Server error rescheduling appointment' });
  }
}

export async function respondReschedule(req, res) {
  const { id } = req.params;
  const { action, slotId } = req.body;
  const { id: userId } = req.user;

  const apptId = parseInt(id, 10);
  if (isNaN(apptId)) {
    return res.status(400).json({ error: 'Invalid appointment ID.' });
  }

  // Backwards compatibility for old body format { accept: boolean }
  let targetAction = action;
  if (targetAction === undefined && req.body.accept !== undefined) {
    targetAction = req.body.accept ? 'accept' : 'decline';
  }

  if (!['accept', 'decline', 'request_another'].includes(targetAction)) {
    return res.status(400).json({ error: 'Invalid action. Must be accept, decline, or request_another.' });
  }

  try {
    const [appts] = await pool.query('SELECT * FROM appointments WHERE id = ?', [apptId]);
    if (appts.length === 0) return res.status(404).json({ error: 'Appointment no longer exists.' });
    const appt = appts[0];

    // Client must be the one responding
    if (appt.client_id !== userId) {
      return res.status(403).json({ error: 'You are not authorized to respond to this reschedule request.' });
    }

    if (targetAction === 'accept') {
      if (!appt.reschedule_slot_id || appt.reschedule_status !== 'PENDING_CLIENT') {
        return res.status(400).json({ error: 'No pending reschedule proposal for this appointment.' });
      }

      // Fetch the proposed slot
      const [slots] = await pool.query('SELECT * FROM advocate_slots WHERE id = ?', [appt.reschedule_slot_id]);
      if (slots.length === 0) return res.status(404).json({ error: 'No available slot found.' });
      const slot = slots[0];

      if (!slot.is_active) {
        return res.status(400).json({ error: 'The proposed slot is no longer active.' });
      }

      // Check slot availability
      const [bookings] = await pool.query(
        "SELECT COUNT(*) as count FROM appointments WHERE slot_id = ? AND status IN ('scheduled', 'pending') AND id != ?",
        [appt.reschedule_slot_id, apptId]
      );
      if (bookings[0].count >= slot.max_bookings) {
        return res.status(400).json({ error: 'Slot already booked.' });
      }

      const datePart = new Date(slot.slot_date).toISOString().split('T')[0];
      const newDateTime = `${datePart} ${slot.start_time}`;

      // Generate meet link
      const p1 = Math.random().toString(36).substring(2, 5);
      const p2 = Math.random().toString(36).substring(2, 6);
      const p3 = Math.random().toString(36).substring(2, 5);
      const meetingLink = `https://meet.google.com/${p1}-${p2}-${p3}`;

      await pool.query(
        `UPDATE appointments SET 
          appointment_date = ?,
          status = 'scheduled',
          slot_id = ?,
          duration_minutes = ?,
          consultation_type = ?,
          reschedule_slot_id = NULL,
          reschedule_status = 'ACCEPTED',
          meeting_link = ?,
          meeting_provider = 'GOOGLE_MEET',
          meeting_status = 'CREATED',
          meeting_created_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [newDateTime, slot.id, slot.duration_minutes, slot.consultation_type, meetingLink, apptId]
      );

      // Notify advocate
      const [advs] = await pool.query('SELECT user_id FROM advocates WHERE id = ?', [appt.advocate_id]);
      if (advs.length > 0) {
        await pool.query(
          'INSERT INTO notifications (user_id, message, is_read) VALUES (?, ?, ?)',
          [advs[0].user_id, `Client accepted the rescheduled consultation slot on ${datePart} at ${slot.start_time}.`, false]
        );
      }

      return res.json({ message: 'Reschedule request sent successfully.', meeting_link: meetingLink });

    } else if (targetAction === 'decline') {
      if (appt.reschedule_status !== 'PENDING_CLIENT') {
        return res.status(400).json({ error: 'No pending reschedule proposal to decline.' });
      }

      await pool.query(
        `UPDATE appointments SET 
          status = 'Reschedule Declined', 
          reschedule_status = 'DECLINED',
          reschedule_slot_id = NULL
         WHERE id = ?`,
        [apptId]
      );

      // Notify advocate
      const [advs] = await pool.query('SELECT user_id FROM advocates WHERE id = ?', [appt.advocate_id]);
      if (advs.length > 0) {
        await pool.query(
          'INSERT INTO notifications (user_id, message, is_read) VALUES (?, ?, ?)',
          [advs[0].user_id, `Client declined the rescheduled consultation slot.`, false]
        );
      }

      return res.json({ message: 'Reschedule request sent successfully.' });

    } else if (targetAction === 'request_another') {
      const newSlotId = parseInt(slotId, 10);
      if (isNaN(newSlotId)) {
        return res.status(400).json({ error: 'Invalid or missing slot ID for requested another time.' });
      }

      // Check slot availability and exists
      const [slots] = await pool.query('SELECT * FROM advocate_slots WHERE id = ? AND advocate_id = ?', [newSlotId, appt.advocate_id]);
      if (slots.length === 0) return res.status(404).json({ error: 'No available slot found.' });
      const slot = slots[0];

      if (!slot.is_active) {
        return res.status(400).json({ error: 'The selected slot is inactive.' });
      }

      const [bookings] = await pool.query(
        "SELECT COUNT(*) as count FROM appointments WHERE slot_id = ? AND status IN ('scheduled', 'pending') AND id != ?",
        [newSlotId, apptId]
      );
      if (bookings[0].count >= slot.max_bookings) {
        return res.status(400).json({ error: 'Slot already booked.' });
      }

      await pool.query(
        `UPDATE appointments SET 
          reschedule_slot_id = ?, 
          reschedule_status = 'PENDING_ADVOCATE' 
         WHERE id = ?`,
        [newSlotId, apptId]
      );

      const datePart = new Date(slot.slot_date).toISOString().split('T')[0];

      // Notify advocate
      const [advs] = await pool.query('SELECT user_id FROM advocates WHERE id = ?', [appt.advocate_id]);
      if (advs.length > 0) {
        await pool.query(
          'INSERT INTO notifications (user_id, message, is_read) VALUES (?, ?, ?)',
          [advs[0].user_id, `Client requested another time slot: ${datePart} at ${slot.start_time}.`, false]
        );
      }

      return res.json({ message: 'Reschedule request sent successfully.' });
    }

  } catch (error) {
    console.error('Respond reschedule error:', error);
    res.status(500).json({ error: 'Server error responding to reschedule' });
  }
}
