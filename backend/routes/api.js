import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import * as authController from '../controllers/authController.js';
import * as advocateController from '../controllers/advocateController.js';
import * as caseController from '../controllers/caseController.js';
import * as aiController from '../controllers/aiController.js';

const router = express.Router();

// --- Auth Routes ---
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.post('/verification/login', authController.verificationLogin);
router.get('/auth/me', authenticateToken, authController.getCurrentUser);

// --- Advocate Directory & Consultation Booking ---
router.get('/advocates', authenticateToken, advocateController.getAdvocates);
router.get('/advocates/:id', authenticateToken, advocateController.getAdvocateById);
router.get('/specializations', advocateController.getSpecializations);
router.post('/consultations/book', authenticateToken, advocateController.bookConsultation);
router.post('/advocates/verify', authenticateToken, advocateController.verifyAdvocate);
router.get('/admin/verifications', authenticateToken, advocateController.getVerificationList);
router.post('/admin/verify-action', authenticateToken, advocateController.adminVerifyAction);
router.get('/admin/users', authenticateToken, advocateController.getAllUsers);
router.delete('/admin/users/:id', authenticateToken, advocateController.deleteUser);
router.put('/advocates/profile', authenticateToken, advocateController.editAdvocateProfile);
router.get('/admin/audit-logs', authenticateToken, advocateController.getAuditLogs);

// --- Cases Dashboard Management ---
router.get('/cases', authenticateToken, caseController.getCases);
router.get('/cases/:id', authenticateToken, caseController.getCaseById);
router.post('/cases', authenticateToken, caseController.createCase);
router.post('/cases/update', authenticateToken, caseController.addCaseUpdate);
router.get('/cases/:caseId/what-next', authenticateToken, caseController.getWhatHappensNext);

// --- Appointments & Documents Uploads ---
router.get('/appointments', authenticateToken, caseController.getAppointments);
router.post('/appointments/:id/accept', authenticateToken, caseController.acceptAppointment);
router.post('/appointments/:id/reject', authenticateToken, caseController.rejectAppointment);
router.post('/appointments/:id/reschedule', authenticateToken, caseController.rescheduleAppointment);
router.post('/appointments/:id/reschedule-response', authenticateToken, caseController.respondReschedule);
router.post('/appointments/:id/complete', authenticateToken, caseController.completeAppointment);
router.post('/documents/upload', authenticateToken, caseController.uploadDocument);
router.get('/notifications', authenticateToken, caseController.getNotifications);
router.post('/notifications/read', authenticateToken, caseController.markNotificationsRead);

// --- Advocate Availability Slots ---
router.get('/slots/my', authenticateToken, advocateController.getMySlots);
router.post('/slots', authenticateToken, advocateController.createSlot);
router.put('/slots/:id', authenticateToken, advocateController.updateSlot);
router.delete('/slots/:id', authenticateToken, advocateController.deleteSlot);
router.get('/advocates/:id/slots', authenticateToken, advocateController.getAdvocateSlots);

// --- AI Copilot Core ---
router.post('/copilot/chat', authenticateToken, aiController.chatCopilot);
router.post('/ai/chat', authenticateToken, aiController.chatCopilot);
router.get('/ai/chat/history', authenticateToken, aiController.getChatHistory);
router.post('/ai/chat/clear', authenticateToken, aiController.clearChatHistory);
router.post('/ai/check-doc', authenticateToken, aiController.checkDocDirect);
router.post('/ai/explain-hearing', authenticateToken, aiController.explainHearingDirect);
router.post('/ai/what-next', authenticateToken, aiController.whatNextDirect);

export default router;
