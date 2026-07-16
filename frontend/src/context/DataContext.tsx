import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useLanguage } from './LanguageContext';

interface DataContextType {
  specializations: any[];
  advocates: any[];
  cases: any[];
  appointments: any[];
  aiHistory: any[];
  notifications: any[];
  isLoading: boolean;
  fetchSpecializations: () => Promise<any[]>;
  fetchAdvocates: (filters?: any) => Promise<any[]>;
  fetchAdvocateDetails: (id: number) => Promise<any>;
  bookConsultation: (advocateId: number, date: string, notes: string, slotId?: number) => Promise<any>;
  fetchCases: () => Promise<any[]>;
  fetchCaseDetails: (id: number) => Promise<any>;
  createCase: (data: any) => Promise<any>;
  addCaseUpdate: (data: any) => Promise<any>;
  uploadDocument: (data: any) => Promise<any>;
  chatWithAi: (message: string, langOverride?: string) => Promise<any>;
  fetchAiHistory: () => Promise<any[]>;
  getWhatNext: (caseId: number) => Promise<any>;
  fetchNotifications: () => Promise<any[]>;
  markNotificationsRead: () => Promise<void>;
  fetchAppointments: () => Promise<any[]>;
  // Slot management
  fetchMySlots: () => Promise<any[]>;
  fetchAdvocateSlots: (advocateId: number) => Promise<any[]>;
  createSlot: (data: any) => Promise<any>;
  updateSlot: (id: number, data: any) => Promise<any>;
  deleteSlot: (id: number) => Promise<void>;
  // Appointment actions
  rejectAppointment: (id: number, reason: string) => Promise<any>;
  rescheduleAppointment: (id: number, slotId: number, reason?: string) => Promise<any>;
  respondReschedule: (id: number, action: 'accept' | 'decline' | 'request_another', slotId?: number) => Promise<any>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const API_URL = import.meta.env.VITE_API_URL || '/api';

// MOCK LOCAL STORE SEEDS (for Demo Mode)
const localCategories = [
  { id: 1, name: 'Family Law', description: 'Divorce, custody, alimony, and family property.' },
  { id: 2, name: 'Civil Law', description: 'Breach of contract, recovery suits, defamation.' },
  { id: 3, name: 'Criminal Law', description: 'FIR, bail, trials, and criminal defense.' },
  { id: 4, name: 'Property Law', description: 'Land, real estate, construction disputes.' },
  { id: 5, name: 'Consumer Law', description: 'Defective products, service defaults, refunds.' },
  { id: 6, name: 'Cyber Law', description: 'Cybercrime, data privacy, online fraud.' },
  { id: 7, name: 'Labour Law', description: 'Wages, wrongful dismissal, PF, ESIC.' },
  { id: 8, name: 'Corporate Law', description: 'Business registration, mergers, compliance.' },
  { id: 9, name: 'Tax Law', description: 'Income tax, GST, tax evasion disputes.' },
  { id: 10, name: 'Banking Law', description: 'Loan disputes, NPA, cheque dishonour, SARFAESI.' },
  { id: 11, name: 'Motor Accident Claims', description: 'MACT claims, insurance disputes, accident compensation.' },
  { id: 12, name: 'Medical Negligence', description: 'Hospital malpractice, wrong treatment, compensation.' },
  { id: 13, name: 'Divorce', description: 'Contested and mutual consent divorce proceedings.' },
  { id: 14, name: 'Domestic Violence', description: 'Protection orders, shelter, DV Act cases.' },
  { id: 15, name: 'Child Custody', description: 'Custody battles, visitation rights, guardianship.' },
  { id: 16, name: 'Senior Citizen Law', description: 'Maintenance, property rights, elder abuse.' },
  { id: 17, name: 'Women Protection', description: 'Harassment, rape laws, POCSO, women rights.' },
  { id: 18, name: 'Constitutional Law', description: 'Fundamental rights, PILs, constitutional petitions.' },
  { id: 19, name: 'Environmental Law', description: 'Pollution, forest, green tribunal, NGT cases.' },
  { id: 20, name: 'Intellectual Property', description: 'Patents, trademarks, copyright, trade secrets.' },
  { id: 21, name: 'Real Estate', description: 'RERA disputes, builder fraud, property registration.' },
  { id: 22, name: 'Cheque Bounce (NI Act)', description: 'Section 138 NI Act cheque dishonour cases.' },
  { id: 23, name: 'Land Disputes', description: 'Survey, encroachment, title, mutation records.' },
  { id: 24, name: 'Education Law', description: 'Admission disputes, RTI in education, fee hike.' },
  { id: 25, name: 'Immigration Law', description: 'Visa, OCI, passport, citizenship disputes.' },
];

const localAdvocates = [
  // ── Family Law (id:1) ──
  { id: 1, name: 'Adv. Aditi Sharma', bar_registration: 'BAR/DEL/2012/987', specialization_id: 1, specialization_name: 'Family Law', experience_years: 12, languages: JSON.stringify(['English','Hindi']), biography: 'Experienced Family Law advocate dedicated to divorce, child custody, and inheritance disputes with compassion.', consultation_fee: 1500, location: 'New Delhi', rating: 4.8, profile_photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150', availability: 'Available Tomorrow', is_verified: true, cases_handled: 240 },
  { id: 2, name: 'Adv. Priya Nair', bar_registration: 'BAR/KER/2018/223', specialization_id: 1, specialization_name: 'Family Law', experience_years: 6, languages: JSON.stringify(['English','Malayalam','Hindi']), biography: 'Focuses on marital disputes, adoption procedures, and domestic rights counselling.', consultation_fee: 800, location: 'Kochi', rating: 4.4, profile_photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150', availability: 'Available Today', is_verified: true, cases_handled: 110 },
  { id: 3, name: 'Adv. Sunita Yadav', bar_registration: 'BAR/UP/2009/441', specialization_id: 1, specialization_name: 'Family Law', experience_years: 15, languages: JSON.stringify(['Hindi','English']), biography: 'Expert in ancestral property divisions, matrimonial causes, and Hindu succession law.', consultation_fee: 1200, location: 'Lucknow', rating: 4.7, profile_photo: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=150', availability: 'Available Tomorrow', is_verified: true, cases_handled: 320 },
  { id: 4, name: 'Adv. Rohan Mehta', bar_registration: 'BAR/GUJ/2014/567', specialization_id: 1, specialization_name: 'Family Law', experience_years: 10, languages: JSON.stringify(['Gujarati','Hindi','English']), biography: 'Handles family court litigation with specialization in alimony and maintenance proceedings.', consultation_fee: 1100, location: 'Ahmedabad', rating: 4.5, profile_photo: 'https://images.unsplash.com/photo-1556157382-97eda2d62296?w=150', availability: 'Available in 2 Days', is_verified: true, cases_handled: 175 },

  // ── Civil Law (id:2) ──
  { id: 5, name: 'Adv. Meera Desai', bar_registration: 'BAR/MAH/2015/634', specialization_id: 2, specialization_name: 'Civil Law', experience_years: 9, languages: JSON.stringify(['English','Hindi','Marathi']), biography: 'Specializes in civil disputes, contract violations, damages claims, and consumer protection litigation.', consultation_fee: 1200, location: 'Mumbai', rating: 4.7, profile_photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150', availability: 'Available on Monday', is_verified: true, cases_handled: 190 },
  { id: 6, name: 'Adv. Joseph Anthony', bar_registration: 'BAR/TN/2002/103', specialization_id: 2, specialization_name: 'Civil Law', experience_years: 22, languages: JSON.stringify(['English','Tamil']), biography: 'Expert civil litigator handling high-stakes commercial disputes, damage claims, and injunction suits.', consultation_fee: 3000, location: 'Chennai', rating: 4.9, profile_photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150', availability: 'Available in 3 Days', is_verified: true, cases_handled: 480 },
  { id: 7, name: 'Adv. Kavitha Rajan', bar_registration: 'BAR/KAR/2016/789', specialization_id: 2, specialization_name: 'Civil Law', experience_years: 8, languages: JSON.stringify(['Kannada','English','Tamil']), biography: 'Handles civil suits involving defamation, negligence, and breach of contract with precision.', consultation_fee: 900, location: 'Bengaluru', rating: 4.3, profile_photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150', availability: 'Available Today', is_verified: true, cases_handled: 140 },

  // ── Criminal Law (id:3) ──
  { id: 8, name: 'Adv. Sanjay Verma', bar_registration: 'BAR/UP/2005/778', specialization_id: 3, specialization_name: 'Criminal Law', experience_years: 19, languages: JSON.stringify(['Hindi','English']), biography: 'Expert criminal defense lawyer specializing in bail applications, criminal trials, and cyber-crime litigation.', consultation_fee: 2000, location: 'Lucknow', rating: 4.9, profile_photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', availability: 'Available Tomorrow', is_verified: true, cases_handled: 410 },
  { id: 9, name: 'Adv. Sandeep Naidu', bar_registration: 'BAR/AP/2013/889', specialization_id: 3, specialization_name: 'Criminal Law', experience_years: 11, languages: JSON.stringify(['Telugu','English']), biography: 'Defense counsel for financial fraud, bail petitions, FIR quashing, and sessions trial.', consultation_fee: 1700, location: 'Vijayawada', rating: 4.7, profile_photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', availability: 'Available Tomorrow', is_verified: true, cases_handled: 230 },
  { id: 10, name: 'Adv. Ashok Tiwari', bar_registration: 'BAR/MP/2008/312', specialization_id: 3, specialization_name: 'Criminal Law', experience_years: 16, languages: JSON.stringify(['Hindi','English']), biography: 'Specializes in anticipatory bail, murder trials, and NDPS cases before High Courts.', consultation_fee: 2200, location: 'Bhopal', rating: 4.8, profile_photo: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150', availability: 'Available in 2 Days', is_verified: true, cases_handled: 360 },

  // ── Property Law (id:4) ──
  { id: 11, name: 'Adv. K. Srinivasa Rao', bar_registration: 'BAR/AP/1998/142', specialization_id: 4, specialization_name: 'Property Law', experience_years: 25, languages: JSON.stringify(['English','Telugu']), biography: 'Senior property advocate. Expertise in land registry, builder disputes, tenancy, and joint development agreements.', consultation_fee: 2500, location: 'Hyderabad', rating: 4.9, profile_photo: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150', availability: 'Available Tomorrow', is_verified: true, cases_handled: 540 },
  { id: 12, name: 'Adv. Manoj Patil', bar_registration: 'BAR/MP/2007/351', specialization_id: 4, specialization_name: 'Property Law', experience_years: 17, languages: JSON.stringify(['Hindi','English','Marathi']), biography: 'Deals extensively with land encroachment, partition suits, and ancestral property title disputes.', consultation_fee: 1800, location: 'Bhopal', rating: 4.8, profile_photo: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150', availability: 'Available Tomorrow', is_verified: true, cases_handled: 290 },
  { id: 13, name: 'Adv. Neeraj Bansal', bar_registration: 'BAR/RAJ/2011/456', specialization_id: 4, specialization_name: 'Property Law', experience_years: 13, languages: JSON.stringify(['Hindi','Rajasthani','English']), biography: 'Expert in property documentation, mutation records, and revenue court proceedings.', consultation_fee: 1400, location: 'Jaipur', rating: 4.6, profile_photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', availability: 'Available Today', is_verified: true, cases_handled: 210 },

  // ── Consumer Law (id:5) ──
  { id: 14, name: 'Adv. Vikram Singh', bar_registration: 'BAR/KAR/2010/894', specialization_id: 5, specialization_name: 'Consumer Law', experience_years: 14, languages: JSON.stringify(['English','Kannada','Hindi']), biography: 'Passionate advocate representing consumers against deceptive business practices, product defects, and insurance denials.', consultation_fee: 1500, location: 'Bengaluru', rating: 4.6, profile_photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', availability: 'Available in 2 Days', is_verified: true, cases_handled: 310 },
  { id: 15, name: 'Adv. Leela Krishnamurthy', bar_registration: 'BAR/TN/2013/678', specialization_id: 5, specialization_name: 'Consumer Law', experience_years: 11, languages: JSON.stringify(['Tamil','English']), biography: 'Handles consumer forum complaints, e-commerce disputes, and insurance claim rejections.', consultation_fee: 1000, location: 'Chennai', rating: 4.5, profile_photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150', availability: 'Available Tomorrow', is_verified: true, cases_handled: 185 },
  { id: 16, name: 'Adv. Sameer Ahuja', bar_registration: 'BAR/DEL/2016/234', specialization_id: 5, specialization_name: 'Consumer Law', experience_years: 8, languages: JSON.stringify(['Hindi','English','Punjabi']), biography: 'Specializes in consumer protection before District Forums and State Commissions.', consultation_fee: 900, location: 'New Delhi', rating: 4.3, profile_photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', availability: 'Available Today', is_verified: true, cases_handled: 130 },

  // ── Cyber Law (id:6) ──
  { id: 17, name: 'Adv. Divya Menon', bar_registration: 'BAR/KER/2017/445', specialization_id: 6, specialization_name: 'Cyber Law', experience_years: 7, languages: JSON.stringify(['English','Malayalam','Hindi']), biography: 'Specializes in cybercrime cases, data breach, online fraud, and IT Act violations.', consultation_fee: 1800, location: 'Bengaluru', rating: 4.6, profile_photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150', availability: 'Available Tomorrow', is_verified: true, cases_handled: 140 },
  { id: 18, name: 'Adv. Rahul Bose', bar_registration: 'BAR/WB/2014/789', specialization_id: 6, specialization_name: 'Cyber Law', experience_years: 10, languages: JSON.stringify(['Bengali','English','Hindi']), biography: 'Expert in social media defamation, hacking incidents, and digital evidence law.', consultation_fee: 2000, location: 'Kolkata', rating: 4.7, profile_photo: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150', availability: 'Available in 2 Days', is_verified: true, cases_handled: 170 },
  { id: 19, name: 'Adv. Preethi Suresh', bar_registration: 'BAR/TN/2019/112', specialization_id: 6, specialization_name: 'Cyber Law', experience_years: 5, languages: JSON.stringify(['Tamil','English']), biography: 'Handles UPI fraud, phishing attacks, and cyberstalking complaints for individuals and corporates.', consultation_fee: 1200, location: 'Chennai', rating: 4.4, profile_photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150', availability: 'Available Today', is_verified: false, cases_handled: 85 },

  // ── Labour Law (id:7) ──
  { id: 20, name: 'Adv. Rajesh Reddy', bar_registration: 'BAR/TS/2016/512', specialization_id: 7, specialization_name: 'Labour Law', experience_years: 8, languages: JSON.stringify(['Telugu','English']), biography: 'Advocate specializing in employment disputes, labor court representations, and work safety violations.', consultation_fee: 1000, location: 'Visakhapatnam', rating: 4.5, profile_photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', availability: 'Available Today', is_verified: true, cases_handled: 160 },
  { id: 21, name: 'Adv. Geeta Iyer', bar_registration: 'BAR/MAH/2011/678', specialization_id: 7, specialization_name: 'Labour Law', experience_years: 13, languages: JSON.stringify(['Marathi','Hindi','English']), biography: 'Handles gratuity disputes, factory act violations, and wrongful termination cases.', consultation_fee: 1300, location: 'Pune', rating: 4.7, profile_photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150', availability: 'Available Tomorrow', is_verified: true, cases_handled: 240 },
  { id: 22, name: 'Adv. Harish Kumar', bar_registration: 'BAR/HR/2007/334', specialization_id: 7, specialization_name: 'Labour Law', experience_years: 17, languages: JSON.stringify(['Hindi','Haryanvi','English']), biography: 'Expert in ESIC, EPF disputes, minimum wages law, and industrial tribunal cases.', consultation_fee: 1600, location: 'Gurugram', rating: 4.8, profile_photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150', availability: 'Available in 2 Days', is_verified: true, cases_handled: 310 },

  // ── Corporate Law (id:8) ──
  { id: 23, name: 'Adv. Ravi Shankar', bar_registration: 'BAR/MAH/2009/234', specialization_id: 8, specialization_name: 'Corporate Law', experience_years: 15, languages: JSON.stringify(['English','Hindi','Marathi']), biography: 'Expert in company incorporation, M&A due diligence, SEBI compliance, and corporate governance.', consultation_fee: 3500, location: 'Mumbai', rating: 4.8, profile_photo: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150', availability: 'Available Tomorrow', is_verified: true, cases_handled: 280 },
  { id: 24, name: 'Adv. Nandita Ghosh', bar_registration: 'BAR/WB/2012/556', specialization_id: 8, specialization_name: 'Corporate Law', experience_years: 12, languages: JSON.stringify(['Bengali','English','Hindi']), biography: 'Specializes in startup legal advisory, shareholders agreements, and IBC insolvency filings.', consultation_fee: 2800, location: 'Kolkata', rating: 4.6, profile_photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150', availability: 'Available in 3 Days', is_verified: true, cases_handled: 210 },
  { id: 25, name: 'Adv. Suresh Prabhu', bar_registration: 'BAR/KAR/2006/123', specialization_id: 8, specialization_name: 'Corporate Law', experience_years: 18, languages: JSON.stringify(['Kannada','English','Hindi']), biography: 'Handles board disputes, contract drafting, and foreign investment compliance matters.', consultation_fee: 4000, location: 'Bengaluru', rating: 4.9, profile_photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150', availability: 'Available on Monday', is_verified: true, cases_handled: 390 },

  // ── Tax Law (id:9) ──
  { id: 26, name: 'Adv. Anand Krishnan', bar_registration: 'BAR/TN/2010/345', specialization_id: 9, specialization_name: 'Tax Law', experience_years: 14, languages: JSON.stringify(['Tamil','English']), biography: 'Expert in income tax appeals, GST disputes, and tax evasion defense before tribunals.', consultation_fee: 2000, location: 'Chennai', rating: 4.7, profile_photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', availability: 'Available Tomorrow', is_verified: true, cases_handled: 260 },
  { id: 27, name: 'Adv. Deepa Malhotra', bar_registration: 'BAR/DEL/2013/678', specialization_id: 9, specialization_name: 'Tax Law', experience_years: 11, languages: JSON.stringify(['Hindi','English','Punjabi']), biography: 'Handles direct and indirect tax litigation before ITAT, GST Appellate Authority.', consultation_fee: 1800, location: 'New Delhi', rating: 4.6, profile_photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150', availability: 'Available Today', is_verified: true, cases_handled: 195 },
  { id: 28, name: 'Adv. Mohan Hegde', bar_registration: 'BAR/KAR/2008/901', specialization_id: 9, specialization_name: 'Tax Law', experience_years: 16, languages: JSON.stringify(['Kannada','English','Hindi']), biography: 'Specializes in GST refund claims, customs duty appeals, and FEMA violations.', consultation_fee: 2200, location: 'Bengaluru', rating: 4.8, profile_photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', availability: 'Available in 2 Days', is_verified: true, cases_handled: 305 },

  // ── Banking Law (id:10) ──
  { id: 29, name: 'Adv. Vinod Kapoor', bar_registration: 'BAR/DEL/2006/789', specialization_id: 10, specialization_name: 'Banking Law', experience_years: 18, languages: JSON.stringify(['Hindi','English']), biography: 'Expert in SARFAESI proceedings, DRT cases, loan restructuring, and NPA resolution.', consultation_fee: 2500, location: 'New Delhi', rating: 4.8, profile_photo: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150', availability: 'Available Tomorrow', is_verified: true, cases_handled: 340 },
  { id: 30, name: 'Adv. Lalitha Devi', bar_registration: 'BAR/AP/2014/234', specialization_id: 10, specialization_name: 'Banking Law', experience_years: 10, languages: JSON.stringify(['Telugu','English','Hindi']), biography: 'Handles credit card fraud disputes, banking ombudsman complaints, and cheque dishonour cases.', consultation_fee: 1500, location: 'Hyderabad', rating: 4.5, profile_photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150', availability: 'Available Today', is_verified: true, cases_handled: 175 },
  { id: 31, name: 'Adv. Sunil Thakur', bar_registration: 'BAR/GUJ/2010/456', specialization_id: 10, specialization_name: 'Banking Law', experience_years: 14, languages: JSON.stringify(['Gujarati','Hindi','English']), biography: 'Specializes in bank guarantee disputes, LC fraud cases, and securitization law.', consultation_fee: 2000, location: 'Ahmedabad', rating: 4.6, profile_photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150', availability: 'Available in 2 Days', is_verified: true, cases_handled: 220 },

  // ── Motor Accident Claims (id:11) ──
  { id: 32, name: 'Adv. Balaji Venkat', bar_registration: 'BAR/TN/2011/567', specialization_id: 11, specialization_name: 'Motor Accident Claims', experience_years: 13, languages: JSON.stringify(['Tamil','English']), biography: 'Handles MACT tribunal cases, insurance claim settlements, and disability compensation.', consultation_fee: 1200, location: 'Chennai', rating: 4.7, profile_photo: 'https://images.unsplash.com/photo-1556157382-97eda2d62296?w=150', availability: 'Available Today', is_verified: true, cases_handled: 285 },
  { id: 33, name: 'Adv. Meghna Shukla', bar_registration: 'BAR/UP/2015/890', specialization_id: 11, specialization_name: 'Motor Accident Claims', experience_years: 9, languages: JSON.stringify(['Hindi','English']), biography: 'Specializes in accident victim compensation, hit-and-run cases, and insurance company disputes.', consultation_fee: 1000, location: 'Varanasi', rating: 4.4, profile_photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150', availability: 'Available Tomorrow', is_verified: true, cases_handled: 165 },
  { id: 34, name: 'Adv. Naveen Reddy', bar_registration: 'BAR/TS/2009/234', specialization_id: 11, specialization_name: 'Motor Accident Claims', experience_years: 15, languages: JSON.stringify(['Telugu','English','Hindi']), biography: 'Expert in MACT claims including fatal accident cases and structured settlements.', consultation_fee: 1400, location: 'Hyderabad', rating: 4.8, profile_photo: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150', availability: 'Available in 2 Days', is_verified: true, cases_handled: 325 },

  // ── Medical Negligence (id:12) ──
  { id: 35, name: 'Adv. Shalini Varma', bar_registration: 'BAR/DEL/2014/123', specialization_id: 12, specialization_name: 'Medical Negligence', experience_years: 10, languages: JSON.stringify(['Hindi','English']), biography: 'Handles cases against hospitals, doctors for wrong treatment, delayed diagnosis, and surgical errors.', consultation_fee: 2000, location: 'New Delhi', rating: 4.7, profile_photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150', availability: 'Available Tomorrow', is_verified: true, cases_handled: 155 },
  { id: 36, name: 'Adv. Rajeev Nambiar', bar_registration: 'BAR/KER/2010/678', specialization_id: 12, specialization_name: 'Medical Negligence', experience_years: 14, languages: JSON.stringify(['Malayalam','English']), biography: 'Expert in medical council complaints, MCI appeals, and compensation for hospital malpractice.', consultation_fee: 2500, location: 'Kochi', rating: 4.8, profile_photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', availability: 'Available in 3 Days', is_verified: true, cases_handled: 195 },
  { id: 37, name: 'Adv. Padma Kumari', bar_registration: 'BAR/AP/2016/345', specialization_id: 12, specialization_name: 'Medical Negligence', experience_years: 8, languages: JSON.stringify(['Telugu','English','Hindi']), biography: 'Represents patients in consumer forums and civil courts for medical malpractice claims.', consultation_fee: 1500, location: 'Visakhapatnam', rating: 4.5, profile_photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150', availability: 'Available Today', is_verified: false, cases_handled: 105 },

  // ── Divorce (id:13) ──
  { id: 38, name: 'Adv. Kamala Subramaniam', bar_registration: 'BAR/TN/2008/456', specialization_id: 13, specialization_name: 'Divorce', experience_years: 16, languages: JSON.stringify(['Tamil','English']), biography: 'Handles contested and mutual consent divorce cases with alimony and custody settlements.', consultation_fee: 1800, location: 'Chennai', rating: 4.8, profile_photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150', availability: 'Available Tomorrow', is_verified: true, cases_handled: 380 },
  { id: 39, name: 'Adv. Ranjit Kaur', bar_registration: 'BAR/PB/2012/789', specialization_id: 13, specialization_name: 'Divorce', experience_years: 12, languages: JSON.stringify(['Punjabi','Hindi','English']), biography: 'Expert in NRI divorce cases, international child abduction, and Hague Convention matters.', consultation_fee: 2000, location: 'Chandigarh', rating: 4.7, profile_photo: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=150', availability: 'Available Today', is_verified: true, cases_handled: 265 },
  { id: 40, name: 'Adv. Santosh Pillai', bar_registration: 'BAR/KER/2015/234', specialization_id: 13, specialization_name: 'Divorce', experience_years: 9, languages: JSON.stringify(['Malayalam','English','Hindi']), biography: 'Handles mutual consent divorce filings, maintenance petitions, and remarriage legalities.', consultation_fee: 1200, location: 'Thiruvananthapuram', rating: 4.5, profile_photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', availability: 'Available in 2 Days', is_verified: true, cases_handled: 160 },

  // ── Domestic Violence (id:14) ──
  { id: 41, name: 'Adv. Saraswati Bhat', bar_registration: 'BAR/MAH/2010/567', specialization_id: 14, specialization_name: 'Domestic Violence', experience_years: 14, languages: JSON.stringify(['Marathi','Hindi','English']), biography: 'Handles domestic violence protection orders, shelter home rights, and Section 498A defense.', consultation_fee: 1000, location: 'Pune', rating: 4.7, profile_photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150', availability: 'Available Today', is_verified: true, cases_handled: 290 },
  { id: 42, name: 'Adv. Lakshmi Nanduri', bar_registration: 'BAR/AP/2013/890', specialization_id: 14, specialization_name: 'Domestic Violence', experience_years: 11, languages: JSON.stringify(['Telugu','Hindi','English']), biography: 'Victim advocate specializing in emergency protection orders and domestic violence rehabilitation.', consultation_fee: 800, location: 'Hyderabad', rating: 4.6, profile_photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150', availability: 'Available Tomorrow', is_verified: true, cases_handled: 210 },
  { id: 43, name: 'Adv. Indira Sen', bar_registration: 'BAR/WB/2011/234', specialization_id: 14, specialization_name: 'Domestic Violence', experience_years: 13, languages: JSON.stringify(['Bengali','Hindi','English']), biography: 'Expert in DV Act cases, compensation orders, and matrimonial rights of women.', consultation_fee: 900, location: 'Kolkata', rating: 4.5, profile_photo: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=150', availability: 'Available in 2 Days', is_verified: true, cases_handled: 245 },

  // ── Child Custody (id:15) ──
  { id: 44, name: 'Adv. Manisha Rao', bar_registration: 'BAR/KAR/2013/456', specialization_id: 15, specialization_name: 'Child Custody', experience_years: 11, languages: JSON.stringify(['Kannada','English','Hindi']), biography: 'Handles child custody battles, guardianship applications, and visitation disputes.', consultation_fee: 1500, location: 'Bengaluru', rating: 4.7, profile_photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150', availability: 'Available Tomorrow', is_verified: true, cases_handled: 195 },
  { id: 45, name: 'Adv. Arun Chandra', bar_registration: 'BAR/DEL/2009/789', specialization_id: 15, specialization_name: 'Child Custody', experience_years: 15, languages: JSON.stringify(['Hindi','English']), biography: 'Expert in international child custody disputes, guardian appointment, and welfare petitions.', consultation_fee: 2000, location: 'New Delhi', rating: 4.8, profile_photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', availability: 'Available Today', is_verified: true, cases_handled: 280 },
  { id: 46, name: 'Adv. Revathi Mohan', bar_registration: 'BAR/TN/2015/123', specialization_id: 15, specialization_name: 'Child Custody', experience_years: 9, languages: JSON.stringify(['Tamil','English']), biography: 'Focuses on child welfare, adoption law, and custody matters in family courts.', consultation_fee: 1200, location: 'Coimbatore', rating: 4.5, profile_photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150', availability: 'Available in 2 Days', is_verified: false, cases_handled: 130 },

  // ── Senior Citizen Law (id:16) ──
  { id: 47, name: 'Adv. Subbaiah Reddy', bar_registration: 'BAR/AP/2005/678', specialization_id: 16, specialization_name: 'Senior Citizen Law', experience_years: 19, languages: JSON.stringify(['Telugu','Hindi','English']), biography: 'Handles senior citizen maintenance cases, property rights disputes, and elder abuse complaints.', consultation_fee: 1200, location: 'Hyderabad', rating: 4.7, profile_photo: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150', availability: 'Available Today', is_verified: true, cases_handled: 215 },
  { id: 48, name: 'Adv. Padma Venkatesh', bar_registration: 'BAR/TN/2009/901', specialization_id: 16, specialization_name: 'Senior Citizen Law', experience_years: 15, languages: JSON.stringify(['Tamil','Telugu','English']), biography: 'Expert in Maintenance and Welfare of Parents and Senior Citizens Act cases.', consultation_fee: 1000, location: 'Chennai', rating: 4.6, profile_photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150', availability: 'Available Tomorrow', is_verified: true, cases_handled: 175 },
  { id: 49, name: 'Adv. Ganesh Iyer', bar_registration: 'BAR/MAH/2011/456', specialization_id: 16, specialization_name: 'Senior Citizen Law', experience_years: 13, languages: JSON.stringify(['Marathi','Hindi','English']), biography: 'Handles pension disputes, property transfer cases, and elder care legal rights.', consultation_fee: 900, location: 'Nagpur', rating: 4.4, profile_photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150', availability: 'Available in 2 Days', is_verified: true, cases_handled: 145 },

  // ── Women Protection (id:17) ──
  { id: 50, name: 'Adv. Asha Kumari', bar_registration: 'BAR/DEL/2011/345', specialization_id: 17, specialization_name: 'Women Protection', experience_years: 13, languages: JSON.stringify(['Hindi','English']), biography: 'Handles sexual harassment cases, POCSO, rape law, and workplace protection issues.', consultation_fee: 1200, location: 'New Delhi', rating: 4.8, profile_photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150', availability: 'Available Today', is_verified: true, cases_handled: 310 },
  { id: 51, name: 'Adv. Gayathri Sundaram', bar_registration: 'BAR/TN/2014/678', specialization_id: 17, specialization_name: 'Women Protection', experience_years: 10, languages: JSON.stringify(['Tamil','English']), biography: 'Specializes in sexual offences, women rights litigation, and anti-trafficking cases.', consultation_fee: 1000, location: 'Chennai', rating: 4.7, profile_photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150', availability: 'Available Tomorrow', is_verified: true, cases_handled: 225 },
  { id: 52, name: 'Adv. Zeenat Khan', bar_registration: 'BAR/UP/2016/901', specialization_id: 17, specialization_name: 'Women Protection', experience_years: 8, languages: JSON.stringify(['Urdu','Hindi','English']), biography: 'Represents women in dowry harassment, POSH Act, and triple talaq cases.', consultation_fee: 800, location: 'Lucknow', rating: 4.5, profile_photo: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=150', availability: 'Available in 2 Days', is_verified: true, cases_handled: 145 },

  // ── Constitutional Law (id:18) ──
  { id: 53, name: 'Adv. Mahesh Chandra', bar_registration: 'BAR/DEL/2004/123', specialization_id: 18, specialization_name: 'Constitutional Law', experience_years: 20, languages: JSON.stringify(['Hindi','English']), biography: 'Senior advocate for PILs, fundamental rights, and constitutional interpretation before Supreme Court.', consultation_fee: 5000, location: 'New Delhi', rating: 4.9, profile_photo: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150', availability: 'Available in 3 Days', is_verified: true, cases_handled: 180 },
  { id: 54, name: 'Adv. Smitha George', bar_registration: 'BAR/KER/2012/456', specialization_id: 18, specialization_name: 'Constitutional Law', experience_years: 12, languages: JSON.stringify(['Malayalam','English']), biography: 'Expert in writ petitions, habeas corpus, and civil liberties cases before High Courts.', consultation_fee: 3000, location: 'Kochi', rating: 4.8, profile_photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150', availability: 'Available Tomorrow', is_verified: true, cases_handled: 145 },
  { id: 55, name: 'Adv. Arjun Kapila', bar_registration: 'BAR/PB/2010/789', specialization_id: 18, specialization_name: 'Constitutional Law', experience_years: 14, languages: JSON.stringify(['Punjabi','Hindi','English']), biography: 'Handles Article 32 petitions, constitutional amendments, and judicial review matters.', consultation_fee: 3500, location: 'Chandigarh', rating: 4.7, profile_photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', availability: 'Available Today', is_verified: true, cases_handled: 120 },

  // ── Environmental Law (id:19) ──
  { id: 56, name: 'Adv. Natarajan Pillai', bar_registration: 'BAR/TN/2007/234', specialization_id: 19, specialization_name: 'Environmental Law', experience_years: 17, languages: JSON.stringify(['Tamil','English']), biography: 'Expert in NGT cases, pollution control, and forest clearance litigation.', consultation_fee: 2500, location: 'Chennai', rating: 4.7, profile_photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150', availability: 'Available Tomorrow', is_verified: true, cases_handled: 190 },
  { id: 57, name: 'Adv. Devika Sharma', bar_registration: 'BAR/DEL/2013/567', specialization_id: 19, specialization_name: 'Environmental Law', experience_years: 11, languages: JSON.stringify(['Hindi','English']), biography: 'Handles industrial pollution cases, river protection PILs, and eco-sensitive zone disputes.', consultation_fee: 2000, location: 'New Delhi', rating: 4.6, profile_photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150', availability: 'Available Today', is_verified: true, cases_handled: 155 },
  { id: 58, name: 'Adv. Suresh Babu', bar_registration: 'BAR/KAR/2015/890', specialization_id: 19, specialization_name: 'Environmental Law', experience_years: 9, languages: JSON.stringify(['Kannada','English']), biography: 'Expert in e-waste regulations, coastal zone violations, and environmental impact assessment disputes.', consultation_fee: 1500, location: 'Bengaluru', rating: 4.4, profile_photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', availability: 'Available in 2 Days', is_verified: false, cases_handled: 115 },

  // ── Intellectual Property (id:20) ──
  { id: 59, name: 'Adv. Vikash Oberoi', bar_registration: 'BAR/MAH/2009/123', specialization_id: 20, specialization_name: 'Intellectual Property', experience_years: 15, languages: JSON.stringify(['Hindi','English']), biography: 'Expert in trademark disputes, patent prosecution, and copyright infringement litigation.', consultation_fee: 3000, location: 'Mumbai', rating: 4.8, profile_photo: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150', availability: 'Available Tomorrow', is_verified: true, cases_handled: 250 },
  { id: 60, name: 'Adv. Chandralekha Murthy', bar_registration: 'BAR/KAR/2013/456', specialization_id: 20, specialization_name: 'Intellectual Property', experience_years: 11, languages: JSON.stringify(['Kannada','English','Tamil']), biography: 'Handles software copyright, geographical indication, and trade secret misappropriation cases.', consultation_fee: 2500, location: 'Bengaluru', rating: 4.7, profile_photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150', availability: 'Available Today', is_verified: true, cases_handled: 185 },
  { id: 61, name: 'Adv. Ajay Chakraborty', bar_registration: 'BAR/WB/2011/789', specialization_id: 20, specialization_name: 'Intellectual Property', experience_years: 13, languages: JSON.stringify(['Bengali','English','Hindi']), biography: 'Specializes in film copyright disputes, entertainment law, and brand protection.', consultation_fee: 2000, location: 'Kolkata', rating: 4.6, profile_photo: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150', availability: 'Available in 2 Days', is_verified: true, cases_handled: 175 },

  // ── Real Estate (id:21) ──
  { id: 62, name: 'Adv. Pratibha Singh', bar_registration: 'BAR/UP/2011/234', specialization_id: 21, specialization_name: 'Real Estate', experience_years: 13, languages: JSON.stringify(['Hindi','English']), biography: 'Expert in RERA disputes, builder fraud, flat agreement review, and property registration.', consultation_fee: 1800, location: 'Noida', rating: 4.7, profile_photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150', availability: 'Available Tomorrow', is_verified: true, cases_handled: 280 },
  { id: 63, name: 'Adv. Ramakrishna Naidu', bar_registration: 'BAR/AP/2009/567', specialization_id: 21, specialization_name: 'Real Estate', experience_years: 15, languages: JSON.stringify(['Telugu','English']), biography: 'Handles apartment buyer vs. builder disputes, construction defects, and delay penalty cases.', consultation_fee: 2000, location: 'Hyderabad', rating: 4.8, profile_photo: 'https://images.unsplash.com/photo-1556157382-97eda2d62296?w=150', availability: 'Available Today', is_verified: true, cases_handled: 315 },
  { id: 64, name: 'Adv. Bhavani Krishnaswamy', bar_registration: 'BAR/TN/2016/890', specialization_id: 21, specialization_name: 'Real Estate', experience_years: 8, languages: JSON.stringify(['Tamil','English']), biography: 'Specializes in RERA complaints, layout approval disputes, and property title verification.', consultation_fee: 1400, location: 'Coimbatore', rating: 4.5, profile_photo: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=150', availability: 'Available in 2 Days', is_verified: false, cases_handled: 125 },

  // ── Cheque Bounce (NI Act) (id:22) ──
  { id: 65, name: 'Adv. Satish Chadha', bar_registration: 'BAR/DEL/2010/123', specialization_id: 22, specialization_name: 'Cheque Bounce (NI Act)', experience_years: 14, languages: JSON.stringify(['Hindi','Punjabi','English']), biography: 'Expert in Section 138 NI Act cases, demand notice drafting, and dishonour trial representation.', consultation_fee: 1200, location: 'New Delhi', rating: 4.8, profile_photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', availability: 'Available Today', is_verified: true, cases_handled: 450 },
  { id: 66, name: 'Adv. Mahendran S.', bar_registration: 'BAR/TN/2013/456', specialization_id: 22, specialization_name: 'Cheque Bounce (NI Act)', experience_years: 11, languages: JSON.stringify(['Tamil','English']), biography: 'Handles cheque dishonour complaints, negotiable instruments cases, and execution petitions.', consultation_fee: 1000, location: 'Chennai', rating: 4.7, profile_photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', availability: 'Available Tomorrow', is_verified: true, cases_handled: 380 },
  { id: 67, name: 'Adv. Pradeep Agrawal', bar_registration: 'BAR/MAH/2008/789', specialization_id: 22, specialization_name: 'Cheque Bounce (NI Act)', experience_years: 16, languages: JSON.stringify(['Hindi','Marathi','English']), biography: 'Expert in recovery suits, cheque bounce compliance, and bank guarantee dishonour matters.', consultation_fee: 1500, location: 'Nagpur', rating: 4.6, profile_photo: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150', availability: 'Available in 2 Days', is_verified: true, cases_handled: 410 },

  // ── Land Disputes (id:23) ──
  { id: 68, name: 'Adv. Venkataramaiah N.', bar_registration: 'BAR/AP/2004/234', specialization_id: 23, specialization_name: 'Land Disputes', experience_years: 20, languages: JSON.stringify(['Telugu','English']), biography: 'Handles land survey disputes, encroachment petitions, and agricultural land title cases.', consultation_fee: 2000, location: 'Hyderabad', rating: 4.8, profile_photo: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150', availability: 'Available Tomorrow', is_verified: true, cases_handled: 490 },
  { id: 69, name: 'Adv. Mukesh Lodha', bar_registration: 'BAR/RAJ/2009/567', specialization_id: 23, specialization_name: 'Land Disputes', experience_years: 15, languages: JSON.stringify(['Rajasthani','Hindi','English']), biography: 'Expert in khata transfer disputes, patta land records, and boundary mark violations.', consultation_fee: 1500, location: 'Jodhpur', rating: 4.7, profile_photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150', availability: 'Available Today', is_verified: true, cases_handled: 340 },
  { id: 70, name: 'Adv. Sumathy Natarajan', bar_registration: 'BAR/TN/2012/890', specialization_id: 23, specialization_name: 'Land Disputes', experience_years: 12, languages: JSON.stringify(['Tamil','English']), biography: 'Handles inam land cases, pattadar passbook disputes, and civil court title suits.', consultation_fee: 1300, location: 'Madurai', rating: 4.6, profile_photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150', availability: 'Available in 2 Days', is_verified: true, cases_handled: 225 },

  // ── Education Law (id:24) ──
  { id: 71, name: 'Adv. Rekha Bhandari', bar_registration: 'BAR/DEL/2013/123', specialization_id: 24, specialization_name: 'Education Law', experience_years: 11, languages: JSON.stringify(['Hindi','English']), biography: 'Handles unfair expulsion, fee hike disputes, RTI in education, and CBSE/UGC grievances.', consultation_fee: 1200, location: 'New Delhi', rating: 4.6, profile_photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150', availability: 'Available Today', is_verified: true, cases_handled: 155 },
  { id: 72, name: 'Adv. Sudhir Kannan', bar_registration: 'BAR/TN/2015/456', specialization_id: 24, specialization_name: 'Education Law', experience_years: 9, languages: JSON.stringify(['Tamil','English']), biography: 'Expert in admission disputes, anti-ragging law, and minority institution rights.', consultation_fee: 1000, location: 'Chennai', rating: 4.5, profile_photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', availability: 'Available Tomorrow', is_verified: true, cases_handled: 120 },
  { id: 73, name: 'Adv. Ramya Patel', bar_registration: 'BAR/GUJ/2017/789', specialization_id: 24, specialization_name: 'Education Law', experience_years: 7, languages: JSON.stringify(['Gujarati','Hindi','English']), biography: 'Handles scholarship disputes, private university fee regulation, and student rights cases.', consultation_fee: 900, location: 'Ahmedabad', rating: 4.4, profile_photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150', availability: 'Available in 2 Days', is_verified: false, cases_handled: 80 },

  // ── Immigration Law (id:25) ──
  { id: 74, name: 'Adv. Naresh Malhotra', bar_registration: 'BAR/DEL/2008/234', specialization_id: 25, specialization_name: 'Immigration Law', experience_years: 16, languages: JSON.stringify(['Hindi','Punjabi','English']), biography: 'Expert in visa appeals, OCI card disputes, citizenship renunciation, and overseas Indian cases.', consultation_fee: 2500, location: 'New Delhi', rating: 4.8, profile_photo: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150', availability: 'Available Tomorrow', is_verified: true, cases_handled: 290 },
  { id: 75, name: 'Adv. Sunaina Mistry', bar_registration: 'BAR/MAH/2013/567', specialization_id: 25, specialization_name: 'Immigration Law', experience_years: 11, languages: JSON.stringify(['Gujarati','Hindi','English']), biography: 'Handles passport impounding, foreign national residency, and NRI property disputes.', consultation_fee: 2000, location: 'Mumbai', rating: 4.7, profile_photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150', availability: 'Available Today', is_verified: true, cases_handled: 195 },
  { id: 76, name: 'Adv. David Thomas', bar_registration: 'BAR/KER/2016/890', specialization_id: 25, specialization_name: 'Immigration Law', experience_years: 8, languages: JSON.stringify(['Malayalam','English']), biography: 'Expert in work permit issues, deportation appeals, and stateless person rights.', consultation_fee: 1800, location: 'Kochi', rating: 4.5, profile_photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', availability: 'Available in 2 Days', is_verified: true, cases_handled: 130 },
];

const localReviews = [
  { id: 1, advocate_id: 1, rating: 5, client_name: 'Ramesh Kumar', comment: 'Advocate Aditi helped my family settle an alimony dispute peacefully. Very professional and polite.' },
  { id: 2, advocate_id: 11, rating: 5, client_name: 'Ananya Rao', comment: 'Srinivasa Rao Garu is extremely knowledgeable. Checked my property papers thoroughly and saved me from a major scam.' },
  { id: 3, advocate_id: 8, rating: 4, client_name: 'Savitri Devi', comment: 'Sanjay Verma got bail for my son in a complex theft accusation. Very strong courtroom representation.' },
  { id: 4, advocate_id: 2, rating: 5, client_name: 'John Miller', comment: 'Priya was helpful. She resolved our tenancy contract dispute in a week.' },
  { id: 5, advocate_id: 14, rating: 4, client_name: 'Prakash Patel', comment: 'Adv. Vikram helped with a consumer forum complaint. Good results.' },
  { id: 6, advocate_id: 17, rating: 5, client_name: 'Sneha Iyer', comment: 'Divya Menon was excellent in handling my UPI fraud case. Got recovery within 3 weeks.' },
  { id: 7, advocate_id: 38, rating: 5, client_name: 'Preethi R.', comment: 'Kamala handled my divorce case with utmost sensitivity. Highly recommend.' },
];

const initialLocalCases = [
  {
    id: 1,
    client_id: 1,
    client_name: 'Ramesh Kumar',
    advocate_id: 1,
    advocate_name: 'Adv. Aditi Sharma',
    title: 'Mutual Consent Divorce & Maintenance Division',
    category_id: 1,
    category_name: 'Family Law',
    status: 'Adjourned for filing response',
    health_score: 85,
    health_reasons: JSON.stringify(['Advocate Assigned', 'Initial Petition Filed', 'Income Declarations Missing']),
    ai_summary: 'This case involves a mutual consent divorce petition filed by the parties. Current dispute is regarding the fair evaluation of joint family assets and alimony settlement.',
    next_hearing_date: '2026-08-14 10:30:00',
    created_at: '2026-05-01'
  },
  {
    id: 2,
    client_id: 2,
    client_name: 'Ananya Rao',
    advocate_id: 2,
    advocate_name: 'Adv. K. Srinivasa Rao',
    title: 'Title Suit & Injunction Order against Encroachment',
    category_id: 3,
    category_name: 'Property Dispute',
    status: 'Hearing Scheduled',
    health_score: 95,
    health_reasons: JSON.stringify(['Advocate Assigned', 'Property Deeds Uploaded', 'Boundary Survey Done', 'Next Hearing Confirmed']),
    ai_summary: 'Suit filed for declaration of property title and permanent injunction against neighbor encroaching upon a 200 sq. yard plot in Hyderabad.',
    next_hearing_date: '2026-07-28 11:00:00',
    created_at: '2026-04-10'
  }
];

const initialLocalUpdates = [
  { id: 1, case_id: 1, update_date: '2026-05-10 10:00:00', title: 'Petition Filed', description: 'The initial divorce petition was drafted and submitted to the Family Court.', ai_explanation: 'The divorce case has officially started by filing the request documents in court.', stage: 'Filing Petition' },
  { id: 2, case_id: 1, update_date: '2026-06-12 11:30:00', title: 'Summons Issued', description: 'Court issued summons to the respondent spouse to appear on the next hearing.', ai_explanation: 'The court has ordered your spouse to come to court for the next hearing.', stage: 'Summons Issued' },
  { id: 3, case_id: 1, update_date: '2026-07-02 10:00:00', title: 'Counseling Session', description: 'Both parties attended the mandatory court marriage counseling session.', ai_explanation: 'The court counselor met with both of you to see if you can resolve issues amicably.', stage: 'Counseling Session' },
  { id: 4, case_id: 1, update_date: '2026-07-15 10:00:00', title: 'Matter adjourned for filing counter', description: 'The court postponed the hearing as the respondent requested more time to submit their reply affidavit.', ai_explanation: 'The hearing was postponed because the other party needs time to submit their response.', stage: 'Written Statement Filing' },

  { id: 5, case_id: 2, update_date: '2026-04-12 10:00:00', title: 'Suit for Title Filed', description: 'Plaint registered in the Civil Court for declaration of ownership.', ai_explanation: 'We have officially filed a case in court claiming ownership of the land.', stage: 'Filing Suit' },
  { id: 6, case_id: 2, update_date: '2026-05-20 11:00:00', title: 'Temporary Injunction Application', description: 'Arguments heard on injunction to stop construction work.', ai_explanation: 'We asked the court to temporarily stop the neighbor from building anything on the plot.', stage: 'Injunction Hearing' },
  { id: 7, case_id: 2, update_date: '2026-06-05 14:00:00', title: 'Status Quo Granted', description: 'Court ordered status quo to be maintained on the property by both parties.', ai_explanation: 'The judge ordered that neither you nor the neighbor can change the property state until further notice.', stage: 'Injunction Order' }
];

const initialLocalAppointments = [
  { id: 1, client_id: 1, client_name: 'Ramesh Kumar', advocate_id: 1, advocate_name: 'Adv. Aditi Sharma', appointment_date: '2026-07-17 10:30:00', status: 'scheduled', notes: 'Initial discussion about child support calculations.' },
  { id: 2, client_id: 2, client_name: 'Ananya Rao', advocate_id: 2, advocate_name: 'Adv. K. Srinivasa Rao', appointment_date: '2026-07-18 11:00:00', status: 'scheduled', notes: 'Verifying the boundary survey documents.' }
];

const initialLocalDocuments = [
  {
    id: 1,
    case_id: 1,
    user_id: 1,
    file_name: 'Mutual_Agreement_Draft_Signed.pdf',
    file_type: 'Agreement',
    summary: 'Mutual agreement outline for divorce listing split of assets, child custody on weekends, and a waiver of future claims.',
    key_points: JSON.stringify(['Wife keeps flat in Gurgaon', 'Joint custody of 8-year-old child', 'One-time settlement of Rs. 20 Lakhs agreed']),
    difficult_words: JSON.stringify({
      'alimony': 'A regular sum of money that a court orders a person to pay to their partner after divorce.',
      'custody': 'The legal right to look after a child.',
      'waiver': 'An agreement where you voluntarily give up a legal right.'
    }),
    missing_documents: JSON.stringify(['Income Certificates', 'Joint Bank Statements']),
    uploaded_at: '2026-07-12'
  }
];

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { demoMode, token, user } = useAuth();
  const { language } = useLanguage();
  const [specializations, setSpecializations] = useState<any[]>(localCategories);
  const [advocates, setAdvocates] = useState<any[]>(localAdvocates);
  const [cases, setCases] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [aiHistory, setAiHistory] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Initialize LocalStorage for Demo Mode if not present
  useEffect(() => {
    if (!localStorage.getItem('ns_cases')) {
      localStorage.setItem('ns_cases', JSON.stringify(initialLocalCases));
    }
    if (!localStorage.getItem('ns_updates')) {
      localStorage.setItem('ns_updates', JSON.stringify(initialLocalUpdates));
    }
    if (!localStorage.getItem('ns_appointments')) {
      localStorage.setItem('ns_appointments', JSON.stringify(initialLocalAppointments));
    }
    if (!localStorage.getItem('ns_documents')) {
      localStorage.setItem('ns_documents', JSON.stringify(initialLocalDocuments));
    }
    if (!localStorage.getItem('ns_ai_history')) {
      localStorage.setItem('ns_ai_history', JSON.stringify([]));
    }
    if (!localStorage.getItem('ns_notifications')) {
      const initialLocalNotifications = [
        { id: 1, user_id: 1, message: "Your consultation with Adv. Aditi Sharma is confirmed for Tomorrow at 10:30 AM.", isRead: false, createdAt: new Date().toISOString() },
        { id: 2, user_id: 1, message: "Welcome to Nyaya Setu! Find advocates, upload documents, and track your case.", isRead: true, createdAt: new Date().toISOString() }
      ];
      localStorage.setItem('ns_notifications', JSON.stringify(initialLocalNotifications));
    }
  }, []);

  const getHeaders = () => {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const fetchSpecializations = async () => {
    if (demoMode) {
      return localCategories;
    }
    try {
      const response = await fetch(`${API_URL}/specializations`);
      if (response.ok) {
        const data = await response.json();
        setSpecializations(data);
        return data;
      }
    } catch (e) {
      console.warn('Backend connection error, using mock specializations');
    }
    return localCategories;
  };

  const fetchAdvocates = async (filters: any = {}) => {
    if (demoMode) {
      let filtered = [...localAdvocates];
      if (filters.specializationId) {
        filtered = filtered.filter(a => a.specialization_id === parseInt(filters.specializationId));
      }
      if (filters.location) {
        filtered = filtered.filter(a => a.location.toLowerCase().includes(filters.location.toLowerCase()));
      }
      if (filters.maxFee) {
        filtered = filtered.filter(a => a.consultation_fee <= parseFloat(filters.maxFee));
      }
      if (filters.language) {
        filtered = filtered.filter(a => {
          let langs: string[] = [];
          try { langs = typeof a.languages === 'string' ? JSON.parse(a.languages) : a.languages; } catch { langs = []; }
          return langs.some((l: string) => l.toLowerCase().includes(filters.language.toLowerCase()));
        });
      }
      if (filters.minRating) {
        filtered = filtered.filter(a => a.rating >= parseFloat(filters.minRating));
      }
      if (filters.minExperience) {
        filtered = filtered.filter(a => a.experience_years >= parseInt(filters.minExperience));
      }
      if (filters.verifiedOnly === 'true' || filters.verifiedOnly === true) {
        filtered = filtered.filter(a => a.is_verified);
      }
      if (filters.availability) {
        filtered = filtered.filter(a => a.availability.toLowerCase().includes(filters.availability.toLowerCase()));
      }
      if (filters.nameSearch) {
        filtered = filtered.filter(a => a.name.toLowerCase().includes(filters.nameSearch.toLowerCase()));
      }

      // Add scores
      const scored = filtered.map(adv => {
        let score = 75;
        const reasons = [`Specializes in ${adv.specialization_name}`];

        if (filters.clientLang) {
          let langs: string[] = [];
          try { langs = typeof adv.languages === 'string' ? JSON.parse(adv.languages) : adv.languages; } catch { langs = []; }
          const speaks = langs.some((l: string) => l.toLowerCase().includes(filters.clientLang.toLowerCase()));
          if (speaks) { score += 10; reasons.push(`Speaks ${filters.clientLang}`); }
        }
        if (filters.clientLocation) {
          const near = adv.location.toLowerCase().includes(filters.clientLocation.toLowerCase());
          if (near) { score += 10; reasons.push(`Nearby location`); }
        }
        if (filters.clientBudget) {
          const budget = adv.consultation_fee <= parseFloat(filters.clientBudget);
          if (budget) { score += 10; reasons.push(`Within budget`); }
        }

        reasons.push(adv.availability);

        return {
          ...adv,
          matchScore: Math.min(100, score),
          matchReason: reasons.join(' • ')
        };
      });

      scored.sort((a, b) => b.matchScore - a.matchScore);
      setAdvocates(scored);
      return scored;
    }

    try {
      const queryParams = new URLSearchParams(filters).toString();
      const response = await fetch(`${API_URL}/advocates?${queryParams}`, {
        headers: getHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setAdvocates(data);
        return data;
      }
    } catch (e) {
      console.warn('Backend connection error');
    }
    return localAdvocates;
  };

  const fetchAdvocateDetails = async (id: number) => {
    if (demoMode) {
      const adv = localAdvocates.find(a => a.id === id);
      const reviews = localReviews.filter(r => r.advocate_id === id);
      return { ...adv, reviews };
    }

    const response = await fetch(`${API_URL}/advocates/${id}`, { headers: getHeaders() });
    if (!response.ok) throw new Error('Failed to load profile');
    return await response.json();
  };

  const bookConsultation = async (advocateId: number, date: string, notes: string, slotId?: number) => {
    if (demoMode) {
      const list = JSON.parse(localStorage.getItem('ns_appointments') || '[]');
      const allCases = JSON.parse(localStorage.getItem('ns_cases') || '[]');
      const allNotes = JSON.parse(localStorage.getItem('ns_notifications') || '[]');
      const adv = localAdvocates.find(a => a.id === advocateId);
      
      const newAppt = {
        id: list.length + 1,
        client_id: user?.id || 1,
        client_name: user?.name || 'Ramesh Kumar',
        advocate_id: advocateId,
        advocate_name: adv?.name || 'Advocate',
        appointment_date: date,
        status: 'pending',
        notes
      };
      list.push(newAppt);
      localStorage.setItem('ns_appointments', JSON.stringify(list));
      setAppointments(list);

      // Create Case (Transactional simulation)
      const newCaseId = allCases.length + 1;
      const newCase = {
        id: newCaseId,
        client_id: user?.id || 1,
        client_name: user?.name || 'Ramesh Kumar',
        advocate_id: advocateId,
        advocate_name: adv?.name || 'Advocate',
        title: `Legal Assessment with ${adv?.name || 'Advocate'}`,
        category_id: adv?.specialization_id || 1,
        category_name: adv?.specialization_name || 'Civil Law',
        status: 'Under Review',
        health_score: 75,
        health_reasons: JSON.stringify(['Advocate Assigned', 'Initial Consultation Scheduled']),
        ai_summary: `Case initiated via consultation booking. Consultation notes: ${notes || 'None'}`,
        next_hearing_date: null,
        created_at: new Date().toISOString().split('T')[0]
      };
      allCases.push(newCase);
      localStorage.setItem('ns_cases', JSON.stringify(allCases));
      setCases(allCases);

      // Create Notifications (Transactional simulation)
      const newNotif1 = {
        id: allNotes.length + 1,
        user_id: adv?.id || 1,
        message: `New consultation booked by client ${user?.name || 'Ramesh Kumar'} for ${date}`,
        isRead: false,
        createdAt: new Date().toISOString()
      };
      const newNotif2 = {
        id: allNotes.length + 2,
        user_id: user?.id || 1,
        message: `Consultation booked with ${adv?.name || 'Advocate'} for ${date}`,
        isRead: false,
        createdAt: new Date().toISOString()
      };
      allNotes.push(newNotif1, newNotif2);
      localStorage.setItem('ns_notifications', JSON.stringify(allNotes));
      setNotifications(allNotes.filter((n: any) => n.user_id === user?.id));

      return newAppt;
    }

    const response = await fetch(`${API_URL}/consultations/book`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ advocateId, appointmentDate: date, notes, slotId })
    });
    if (!response.ok) throw new Error('Failed to book appointment');
    const data = await response.json();
    await fetchAppointments();
    await fetchCases();
    return data;
  };

  const fetchCases = async () => {
    if (demoMode) {
      const allCases = JSON.parse(localStorage.getItem('ns_cases') || '[]');
      let filtered = [];
      if (user?.role === 'advocate') {
        filtered = allCases.filter((c: any) => c.advocate_id === user.advocateDetails?.id);
      } else {
        filtered = allCases.filter((c: any) => c.client_id === user?.id);
      }
      setCases(filtered);
      return filtered;
    }

    try {
      const response = await fetch(`${API_URL}/cases`, { headers: getHeaders() });
      if (response.ok) {
        const data = await response.json();
        setCases(data);
        return data;
      }
    } catch (e) {
      console.warn('Backend connection error');
    }
    return [];
  };

  const fetchCaseDetails = async (id: number) => {
    if (demoMode) {
      const allCases = JSON.parse(localStorage.getItem('ns_cases') || '[]');
      const c = allCases.find((x: any) => x.id === id);
      if (!c) throw new Error('Case not found');

      const allUpdates = JSON.parse(localStorage.getItem('ns_updates') || '[]');
      const updates = allUpdates.filter((u: any) => u.case_id === id).sort((a: any, b: any) => b.id - a.id);

      const allDocs = JSON.parse(localStorage.getItem('ns_documents') || '[]');
      const documents = allDocs.filter((d: any) => d.case_id === id);

      const allAppts = JSON.parse(localStorage.getItem('ns_appointments') || '[]');
      const appointments = allAppts.filter((ap: any) => ap.client_id === c.client_id && ap.advocate_id === c.advocate_id);

      return {
        ...c,
        updates,
        documents,
        appointments
      };
    }

    const response = await fetch(`${API_URL}/cases/${id}`, { headers: getHeaders() });
    if (!response.ok) throw new Error('Failed to fetch case details');
    return await response.json();
  };

  const createCase = async (caseData: any) => {
    if (demoMode) {
      const allCases = JSON.parse(localStorage.getItem('ns_cases') || '[]');
      const allUpdates = JSON.parse(localStorage.getItem('ns_updates') || '[]');

      const newId = allCases.length + 1;
      const cat = localCategories.find(l => l.id === parseInt(caseData.categoryId));

      const newCase = {
        id: newId,
        client_id: parseInt(caseData.clientId),
        client_name: caseData.clientName || 'Client User',
        advocate_id: user?.advocateDetails?.id || 1,
        advocate_name: user?.name || 'Advocate',
        title: caseData.title,
        category_id: caseData.categoryId ? parseInt(caseData.categoryId) : 1,
        category_name: cat ? cat.name : 'Civil Law',
        status: caseData.status || 'Under Review',
        health_score: 80,
        health_reasons: JSON.stringify(['Advocate Assigned', 'Case Dashboard Created']),
        ai_summary: 'This case has been registered by the advocate. Information is being gathered.',
        next_hearing_date: caseData.nextHearingDate || null,
        created_at: new Date().toISOString().split('T')[0]
      };

      allCases.push(newCase);
      localStorage.setItem('ns_cases', JSON.stringify(allCases));

      // Initial Update
      const newUpdate = {
        id: allUpdates.length + 1,
        case_id: newId,
        update_date: new Date().toISOString(),
        title: 'Case Registered',
        description: 'Case dashboard initialized on Nyaya Setu.',
        ai_explanation: 'Your case file has been created. A digital dashboard is now active for monitoring progress.',
        stage: 'Onboarding'
      };
      allUpdates.push(newUpdate);
      localStorage.setItem('ns_updates', JSON.stringify(allUpdates));

      return { caseId: newId };
    }

    const response = await fetch(`${API_URL}/cases`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(caseData)
    });
    if (!response.ok) throw new Error('Failed to create case');
    const data = await response.json();
    await fetchCases();
    return data;
  };  const addCaseUpdate = async (updateData: any) => {
    if (demoMode) {
      const allCases = JSON.parse(localStorage.getItem('ns_cases') || '[]');
      const allUpdates = JSON.parse(localStorage.getItem('ns_updates') || '[]');

      const index = allCases.findIndex((x: any) => x.id === parseInt(updateData.caseId));
      if (index === -1) throw new Error('Case not found');

      try {
        // Retrieve real hearing explanation from AI backend
        const response = await fetch(`${API_URL}/ai/explain-hearing`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({ legaleseText: updateData.description, language })
        });
        
        let aiExp = "Hearing logged.";
        if (response.ok) {
          const data = await response.json();
          aiExp = data.explanation;
        } else {
          throw new Error('AI service unavailable');
        }

        const newUpdate = {
          id: allUpdates.length + 1,
          case_id: parseInt(updateData.caseId),
          update_date: new Date().toISOString(),
          title: updateData.title,
          description: updateData.description,
          ai_explanation: aiExp,
          stage: updateData.stage || 'Ongoing'
        };

        allUpdates.push(newUpdate);
        localStorage.setItem('ns_updates', JSON.stringify(allUpdates));

        // Update case status
        allCases[index].status = updateData.title;
        if (updateData.nextHearingDate) {
          allCases[index].next_hearing_date = updateData.nextHearingDate;
        }
        localStorage.setItem('ns_cases', JSON.stringify(allCases));

        return { aiExplanation: aiExp };
      } catch (err) {
        console.error('Add case update AI error:', err);
        throw new Error('Nyaya Copilot is temporarily unavailable. Please try again in a few moments.');
      }
    }

    const response = await fetch(`${API_URL}/cases/update`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(updateData)
    });
    if (!response.ok) throw new Error('Failed to post case update');
    const data = await response.json();
    await fetchCases();
    return data;
  };

  const uploadDocument = async (docData: any) => {
    if (demoMode) {
      const allDocs = JSON.parse(localStorage.getItem('ns_documents') || '[]');
      const allCases = JSON.parse(localStorage.getItem('ns_cases') || '[]');

      try {
        const textToAnalyze = docData.textContent || `Sample content for file ${docData.fileName} of type ${docData.fileType}`;
        
        // Retrieve real AI document summary/jargon explanation from backend
        const response = await fetch(`${API_URL}/ai/check-doc`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({
            fileName: docData.fileName,
            fileType: docData.fileType,
            textContent: textToAnalyze,
            language
          })
        });

        if (!response.ok) {
          throw new Error('AI service unavailable');
        }

        const aiAnalysis = await response.json();

        const newId = allDocs.length + 1;
        const newDoc = {
          id: newId,
          case_id: docData.caseId ? parseInt(docData.caseId) : null,
          user_id: user?.id || 1,
          file_name: docData.fileName,
          file_type: docData.fileType,
          summary: aiAnalysis.summary,
          key_points: JSON.stringify(aiAnalysis.keyPoints),
          difficult_words: JSON.stringify(aiAnalysis.difficultWords),
          missing_documents: JSON.stringify(aiAnalysis.missingDocuments),
          uploaded_at: new Date().toISOString().split('T')[0]
        };

        allDocs.push(newDoc);
        localStorage.setItem('ns_documents', JSON.stringify(allDocs));

        // Update case health score
        if (docData.caseId) {
          const caseIndex = allCases.findIndex((x: any) => x.id === parseInt(docData.caseId));
          if (caseIndex > -1) {
            let score = Math.min(100, allCases[caseIndex].health_score + 5);
            let reasons = JSON.parse(allCases[caseIndex].health_reasons || '[]');
            const reasonMsg = `Document ${docData.fileType} Uploaded`;
            if (!reasons.includes(reasonMsg)) {
              reasons.push(reasonMsg);
              const index = reasons.indexOf('One Document Missing');
              if (index > -1) {
                reasons.splice(index, 1);
                score = Math.min(100, score + 10);
              }
              allCases[caseIndex].health_score = score;
              allCases[caseIndex].health_reasons = JSON.stringify(reasons);
              localStorage.setItem('ns_cases', JSON.stringify(allCases));
            }
          }
        }

        return {
          document: {
            id: newId,
            fileName: docData.fileName,
            fileType: docData.fileType,
            summary: aiAnalysis.summary,
            keyPoints: aiAnalysis.keyPoints,
            difficultWords: aiAnalysis.difficultWords,
            missingDocuments: aiAnalysis.missingDocuments
          }
        };
      } catch (err) {
        console.error('Document analysis AI error:', err);
        throw new Error('Nyaya Copilot is temporarily unavailable. Please try again in a few moments.');
      }
    }

    const response = await fetch(`${API_URL}/documents/upload`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(docData)
    });
    if (!response.ok) throw new Error('Failed to upload document');
    return await response.json();
  };

  // Auto-detect language from message Unicode script
  const detectLangFromText = (text: string): string => {
    const teluguChars = (text.match(/[\u0C00-\u0C7F]/g) || []).length;
    const hindiChars = (text.match(/[\u0900-\u097F]/g) || []).length;
    if (teluguChars > 0) return 'te';
    if (hindiChars > 0) return 'hi';
    return 'en';
  };

  const chatWithAi = async (message: string, langOverride?: string) => {
    setIsLoading(true);
    // Detect language from actual typed text, fall back to UI setting
    const detectedLang = langOverride || detectLangFromText(message) || language || 'en';
    console.log(`[FRONTEND] Sending message: "${message.substring(0, 80)}" | Detected lang: ${detectedLang}`);
    try {
      const response = await fetch(`${API_URL}/copilot/chat`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ message: message.trim(), language: detectedLang })
      });
      if (response.ok) {
        const data = await response.json();
        setIsLoading(false);

        if (data.success === false) {
          const errMsg = data.error || data.message || 'AI service unavailable';
          throw new Error(errMsg);
        }

        // Keep local chat history updated if in Demo Mode
        if (demoMode) {
          const allHistory = JSON.parse(localStorage.getItem('ns_ai_history') || '[]');
          allHistory.push({
            id: allHistory.length + 1,
            message,
            response: data,
            createdAt: new Date().toISOString()
          });
          localStorage.setItem('ns_ai_history', JSON.stringify(allHistory));
          setAiHistory(allHistory);
        }

        return data;
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || `Server error: ${response.status}`);
      }
    } catch (e: any) {
      setIsLoading(false);
      console.error('[FRONTEND] AI chat error:', e.message);
      throw new Error(e.message || 'Nyaya Copilot is temporarily unavailable. Please try again.');
    }
  };

  const fetchAiHistory = async () => {
    if (demoMode) {
      const history = JSON.parse(localStorage.getItem('ns_ai_history') || '[]');
      setAiHistory(history);
      return history;
    }
    try {
      const response = await fetch(`${API_URL}/ai/chat/history`, { headers: getHeaders() });
      if (response.ok) {
        const data = await response.json();
        setAiHistory(data);
        return data;
      }
    } catch (e) {
      console.warn('Backend connection error');
    }
    return [];
  };

  const getWhatNext = async (caseId: number) => {
    let title = '';
    let status = '';

    if (demoMode) {
      const allCases = JSON.parse(localStorage.getItem('ns_cases') || '[]');
      const c = allCases.find((x: any) => x.id === caseId);
      if (c) {
        title = c.title;
        status = c.status;
      }
    } else {
      const c = cases.find((x: any) => x.id === caseId);
      if (c) {
        title = c.title;
        status = c.status;
      }
    }

    if (!title) {
      try {
        const response = await fetch(`${API_URL}/cases/${caseId}`, { headers: getHeaders() });
        if (response.ok) {
          const c = await response.json();
          title = c.title;
          status = c.status;
        }
      } catch (e) {
        console.warn('Error fetching case info for next stage', e);
      }
    }

    try {
      // Direct call to stage projection LLM endpoint
      const response = await fetch(`${API_URL}/ai/what-next`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ title, status: status || 'Under Review', language })
      });
      if (!response.ok) throw new Error('AI service unavailable');
      return await response.json();
    } catch (err) {
      console.error('WhatNext AI error:', err);
      throw new Error('Nyaya Copilot is temporarily unavailable. Please try again in a few moments.');
    }
  };

  const fetchNotifications = async () => {
    if (demoMode) {
      const list = JSON.parse(localStorage.getItem('ns_notifications') || '[]');
      const filtered = list.filter((n: any) => n.user_id === user?.id);
      setNotifications(filtered);
      return filtered;
    }
    try {
      const response = await fetch(`${API_URL}/notifications`, { headers: getHeaders() });
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
        return data;
      }
    } catch (e) {
      console.warn('Backend connection error fetching notifications');
    }
    return [];
  };

  const markNotificationsRead = async () => {
    if (demoMode) {
      const list = JSON.parse(localStorage.getItem('ns_notifications') || '[]');
      const updated = list.map((n: any) => {
        if (n.user_id === user?.id) {
          return { ...n, isRead: true };
        }
        return n;
      });
      localStorage.setItem('ns_notifications', JSON.stringify(updated));
      setNotifications(updated.filter((n: any) => n.user_id === user?.id));
      return;
    }
    try {
      await fetch(`${API_URL}/notifications/read`, {
        method: 'POST',
        headers: getHeaders()
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (e) {
      console.warn('Backend connection error marking notifications as read');
    }
  };

  const fetchAppointments = async () => {
    if (demoMode) {
      const list = JSON.parse(localStorage.getItem('ns_appointments') || '[]');
      let filtered = [];
      if (user?.role === 'advocate') {
        filtered = list.filter((a: any) => a.advocate_id === user.advocateDetails?.id);
      } else {
        filtered = list.filter((a: any) => a.client_id === user?.id);
      }
      setAppointments(filtered);
      return filtered;
    }
    try {
      const response = await fetch(`${API_URL}/appointments`, { headers: getHeaders() });
      if (response.ok) {
        const data = await response.json();
        setAppointments(data);
        return data;
      }
    } catch (e) {
      console.warn('Backend connection error fetching appointments');
    }
    return [];
  };

  // ─── Slot Management ─────────────────────────────────────────────────────────

  const fetchMySlots = async (): Promise<any[]> => {
    if (demoMode) return [];
    try {
      const res = await fetch(`${API_URL}/slots/my`, { headers: getHeaders() });
      if (res.ok) return await res.json();
    } catch (e) { console.warn('Error fetching my slots', e); }
    return [];
  };

  const fetchAdvocateSlots = async (advocateId: number): Promise<any[]> => {
    if (demoMode) return [];
    try {
      const res = await fetch(`${API_URL}/advocates/${advocateId}/slots`, { headers: getHeaders() });
      if (res.ok) return await res.json();
    } catch (e) { console.warn('Error fetching advocate slots', e); }
    return [];
  };

  const createSlot = async (data: any): Promise<any> => {
    const res = await fetch(`${API_URL}/slots`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create slot');
    }
    return await res.json();
  };

  const updateSlot = async (id: number, data: any): Promise<any> => {
    const res = await fetch(`${API_URL}/slots/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update slot');
    }
    return await res.json();
  };

  const deleteSlot = async (id: number): Promise<void> => {
    const res = await fetch(`${API_URL}/slots/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to delete slot');
    }
  };

  // ─── Appointment Actions ──────────────────────────────────────────────────────

  const rejectAppointment = async (id: number, reason: string): Promise<any> => {
    const res = await fetch(`${API_URL}/appointments/${id}/reject`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ rejection_reason: reason })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to reject appointment');
    }
    await fetchAppointments();
    return await res.json();
  };

  const rescheduleAppointment = async (id: number, slotId: number, reason?: string): Promise<any> => {
    const res = await fetch(`${API_URL}/appointments/${id}/reschedule`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ reschedule_slot_id: slotId, reschedule_reason: reason })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to reschedule appointment');
    }
    await fetchAppointments();
    return await res.json();
  };

  const respondReschedule = async (id: number, action: 'accept' | 'decline' | 'request_another', slotId?: number): Promise<any> => {
    const res = await fetch(`${API_URL}/appointments/${id}/reschedule-response`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action, slotId })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to respond to reschedule');
    }
    await fetchAppointments();
    return await res.json();
  };

  return (
    <DataContext.Provider value={{
      specializations,
      advocates,
      cases,
      appointments,
      aiHistory,
      notifications,
      isLoading,
      fetchSpecializations,
      fetchAdvocates,
      fetchAdvocateDetails,
      bookConsultation,
      fetchCases,
      fetchCaseDetails,
      createCase,
      addCaseUpdate,
      uploadDocument,
      chatWithAi,
      fetchAiHistory,
      getWhatNext,
      fetchNotifications,
      markNotificationsRead,
      fetchAppointments,
      fetchMySlots,
      fetchAdvocateSlots,
      createSlot,
      updateSlot,
      deleteSlot,
      rejectAppointment,
      rescheduleAppointment,
      respondReschedule
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
