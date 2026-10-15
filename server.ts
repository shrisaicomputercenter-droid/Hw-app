import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

// Server-only data types & initial state
export type StudentCategoryType = 'beginner' | 'progressive' | 'proficient';

interface StudentRecord {
  rollNo: number;
  name: string;
  dob: string;
  class: number;
  category?: StudentCategoryType;
}

interface PdfDocumentRecord {
  id: string;
  fileName: string;
  title: string;
  subject: string;
  subjectName: string;
  teacherName: string;
  fileSize: number;
  fileSizeBytes: string;
  uploadedAt: string;
  fileType?: 'pdf' | 'image' | 'file';
  mimeType?: string;
  thumbnailUrl?: string;
  homeworkSubject?: string;
  downloadUrl?: string;
  viewUrl?: string;
}

interface HomeworkRecord {
  subject: string;
  subjectName: string;
  teacherName: string;
  content: string;
  updatedAt: string;
  assignedDate: string;
  attachments?: PdfDocumentRecord[];
  category?: 'all' | StudentCategoryType;
}

interface DoubtMessageRecord {
  id: string;
  rollNo: number;
  studentName: string;
  subject: string;
  teacherName: string;
  senderRole: 'student' | 'teacher';
  message: string;
  timestamp: string;
  readByTeacher: boolean;
  readByStudent: boolean;
  fileAttachment?: PdfDocumentRecord;
}

export interface HomeworkHistoryRecord {
  id: string;
  subject: string;
  subjectName: string;
  teacherName: string;
  content: string;
  assignedDate: string; // e.g. "29 Sep 2026"
  createdAt: string; // ISO string
  attachments?: PdfDocumentRecord[];
  category?: 'all' | StudentCategoryType;
}

export interface CompletionHistoryRecord {
  id: string;
  rollNo: number;
  studentName: string;
  subject: string;
  subjectName: string;
  completed: boolean;
  date: string; // e.g. "29 Sep 2026"
  timestamp: string; // ISO string
  markedBy: 'student' | 'teacher';
  actorName?: string;
  category?: StudentCategoryType;
}

export interface AnnouncementRecord {
  id: string;
  title: string;
  content: string;
  category: 'general' | 'exam' | 'holiday' | 'urgent' | 'homework';
  postedBy: string;
  teacherSubject?: string;
  postedAt: string;
  attachments?: PdfDocumentRecord[];
  readBy?: number[];
}

interface PortalDatabase {
  homework: Record<string, HomeworkRecord>;
  categoryHomework?: Record<string, Record<string, HomeworkRecord>>; // subject -> { all?: hw, beginner?: hw, progressive?: hw, proficient?: hw }
  studentCategories?: Record<string, StudentCategoryType>; // rollNo string -> 'beginner' | 'progressive' | 'proficient'
  completions: Record<string, Record<string, boolean>>; // rollNo -> { english: bool, twau: bool, maths: bool, hindi: bool }
  doubts: DoubtMessageRecord[];
  teacherPasswords?: Record<string, string>; // subjectKey -> password
  studentPasswords?: Record<string, string>; // rollNo string -> password
  sessions?: Record<string, SessionInfo>;
  pdfFiles?: PdfDocumentRecord[];
  avatars?: {
    students: Record<string, string>; // rollNo -> dataUrl or icon
    teachers: Record<string, string>; // subjectKey -> dataUrl or icon
  };
  homeworkHistory?: HomeworkHistoryRecord[];
  completionHistory?: CompletionHistoryRecord[];
  announcements?: AnnouncementRecord[];
}

// Student dataset
const STUDENTS: StudentRecord[] = [
  { rollNo: 501, name: 'Abhishrey Thakur', dob: '13/10/2015', class: 5 },
  { rollNo: 502, name: 'Agrima Dehariya', dob: '24/06/2015', class: 5 },
  { rollNo: 503, name: 'Ananya Bairagi', dob: '01/02/2016', class: 5 },
  { rollNo: 504, name: 'Aradhya Shrivas', dob: '22/03/2016', class: 5 },
  { rollNo: 505, name: 'Arohi Meravi', dob: '16/11/2015', class: 5 },
  { rollNo: 506, name: 'Aruj Pal', dob: '02/09/2015', class: 5 },
  { rollNo: 507, name: 'Arpit Kushwaha', dob: '02/02/2015', class: 5 },
  { rollNo: 508, name: 'Ashwary Sahu', dob: '24/12/2015', class: 5 },
  { rollNo: 509, name: 'Daksh Patel', dob: '18/02/2016', class: 5 },
  { rollNo: 510, name: 'Daksh Uikey', dob: '10/03/2016', class: 5 },
  { rollNo: 511, name: 'Devansh Rajak', dob: '23/11/2015', class: 5 },
  { rollNo: 512, name: 'Devanshu Warkade', dob: '13/10/2015', class: 5 },
  { rollNo: 513, name: 'Goutmi Sarote', dob: '17/03/2015', class: 5 },
  { rollNo: 514, name: 'Harsh Uikey', dob: '20/02/2016', class: 5 },
  { rollNo: 515, name: 'Harshita Saiyam', dob: '28/12/2015', class: 5 },
  { rollNo: 516, name: 'Isha Baghel', dob: '16/02/2016', class: 5 },
  { rollNo: 517, name: 'Isha Tirkey', dob: '29/12/2015', class: 5 },
  { rollNo: 518, name: 'Kangna Patel', dob: '19/07/2015', class: 5 },
  { rollNo: 519, name: 'Maitreya', dob: '26/01/2016', class: 5 },
  { rollNo: 520, name: 'Manvi Deshraj', dob: '02/12/2015', class: 5 },
  { rollNo: 521, name: 'Mishika Sarute', dob: '03/12/2015', class: 5 },
  { rollNo: 522, name: 'Mohammad Faizaan Ulla', dob: '29/05/2015', class: 5 },
  { rollNo: 523, name: 'Mrigank Mishra', dob: '15/01/2016', class: 5 },
  { rollNo: 524, name: 'Nandni Yadav', dob: '12/11/2015', class: 5 },
  { rollNo: 525, name: 'Navya Choudhary', dob: '20/02/2014', class: 5 },
  { rollNo: 526, name: 'Nishchay Tekam', dob: '16/05/2015', class: 5 },
  { rollNo: 527, name: 'Parth Tripathi', dob: '15/07/2015', class: 5 },
  { rollNo: 528, name: 'Prakhar Kushwaha', dob: '20/02/2015', class: 5 },
  { rollNo: 529, name: 'Pratibha Yadav', dob: '14/02/2016', class: 5 },
  { rollNo: 530, name: 'Pukar Kori', dob: '22/07/2015', class: 5 },
  { rollNo: 531, name: 'Puneshwar Uikey', dob: '19/11/2014', class: 5 },
  { rollNo: 532, name: 'Purvika Patel', dob: '09/11/2015', class: 5 },
  { rollNo: 533, name: 'Riona Popatkar', dob: '09/11/2015', class: 5 },
  { rollNo: 534, name: 'Shourya Mishra', dob: '10/03/2015', class: 5 },
  { rollNo: 535, name: 'Siddhi Yadav', dob: '24/08/2015', class: 5 },
  { rollNo: 536, name: 'Suryansh Mishra', dob: '24/01/2016', class: 5 },
  { rollNo: 537, name: 'Sushant Jhariya', dob: '31/12/2015', class: 5 },
  { rollNo: 538, name: 'Talin Baraskar', dob: '05/01/2016', class: 5 },
  { rollNo: 539, name: 'Vaidehi Dubey', dob: '17/09/2015', class: 5 },
  { rollNo: 540, name: 'Virat Singh', dob: '11/06/2015', class: 5 },
  { rollNo: 541, name: 'Pragya Thakur', dob: '15/08/2015', class: 5 },
];

// Teacher accounts info by subject
const TEACHER_INFO_BY_SUBJECT: Record<string, { id: string; name: string; subject: string; subjectName: string }> = {
  english: { id: 'teacher_english', name: "Ms. Riya Verma Ma'am", subject: 'english', subjectName: 'English' },
  twau: { id: 'teacher_twau', name: "Mrs. Smriti Vats Ma'am", subject: 'twau', subjectName: 'TWAU' },
  maths: { id: 'teacher_maths', name: 'Mr. Umesh Kumar Chourasiya Sir', subject: 'maths', subjectName: 'Maths' },
  hindi: { id: 'teacher_hindi', name: 'Ms. Sakshi Baliyan', subject: 'hindi', subjectName: 'Hindi' },
};

const DEFAULT_TEACHER_PASSWORDS: Record<string, string> = {
  english: '1234',
  twau: '2345',
  maths: '3456',
  hindi: '4567',
};

// Database persistence file setup
const DB_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DB_DIR, 'portal_database.json');
const PDF_DIR = path.join(DB_DIR, 'pdfs');
const AVATAR_DIR = path.join(DB_DIR, 'avatars');

function generateDefaultAvatarSvg(role: 'student' | 'teacher', iconOrInitial?: string): string {
  const isStudent = role === 'student';
  const gradStart = isStudent ? '#2563eb' : '#059669';
  const gradEnd = isStudent ? '#4f46e5' : '#0d9488';
  const label = iconOrInitial && iconOrInitial.trim() ? iconOrInitial.trim() : isStudent ? '🎓' : '👩‍🏫';
  const fontSize = label.length > 2 ? '50' : '76';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160">
  <defs>
    <linearGradient id="avatarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${gradStart}" />
      <stop offset="100%" stop-color="${gradEnd}" />
    </linearGradient>
  </defs>
  <rect width="160" height="160" rx="36" fill="url(#avatarGrad)" />
  <text x="50%" y="54%" font-size="${fontSize}" font-weight="900" fill="#ffffff" text-anchor="middle" dominant-baseline="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif">${label}</text>
</svg>`;
}

function migrateAvatarsToDisk(data: PortalDatabase) {
  if (!fs.existsSync(AVATAR_DIR)) {
    fs.mkdirSync(AVATAR_DIR, { recursive: true });
  }
  if (!data.avatars) return;

  let modified = false;

  // Migrate students
  if (data.avatars.students) {
    for (const [rollStr, val] of Object.entries(data.avatars.students)) {
      if (typeof val === 'string' && val.startsWith('data:image/')) {
        try {
          const filePath = path.join(AVATAR_DIR, `student_${rollStr}.jpg`);
          const base64Data = val.replace(/^data:image\/\w+;base64,/, '');
          fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
          data.avatars.students[rollStr] = `/api/avatar/student/${rollStr}?t=${Date.now()}`;
          modified = true;
        } catch (e) {
          console.error(`Error migrating student ${rollStr} avatar:`, e);
        }
      }
    }
  }

  // Migrate teachers
  if (data.avatars.teachers) {
    for (const [subj, val] of Object.entries(data.avatars.teachers)) {
      if (typeof val === 'string' && val.startsWith('data:image/')) {
        try {
          const filePath = path.join(AVATAR_DIR, `teacher_${subj.toLowerCase()}.jpg`);
          const base64Data = val.replace(/^data:image\/\w+;base64,/, '');
          fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
          data.avatars.teachers[subj] = `/api/avatar/teacher/${subj.toLowerCase()}?t=${Date.now()}`;
          modified = true;
        } catch (e) {
          console.error(`Error migrating teacher ${subj} avatar:`, e);
        }
      }
    }
  }

  if (modified) {
    try {
      fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error saving migrated avatars:', e);
    }
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function generateSamplePdfBuffer(title: string, subjectName: string, teacherName: string): Buffer {
  const content = `BT
/F1 16 Tf
50 730 Td
(PM SHRI KENDRIYA VIDYALAYA MANDLA) Tj
/F1 12 Tf
0 -26 Td
(Class 5 Practice Worksheet - ${subjectName}) Tj
/F1 10 Tf
0 -20 Td
(Faculty: ${teacherName} | Session 2025-2026) Tj
/F1 11 Tf
0 -30 Td
(Topic: ${title}) Tj
/F1 9 Tf
0 -24 Td
(Instructions for Students:) Tj
0 -18 Td
(1. Solve all questions neatly in your Subject Homework Notebook.) Tj
0 -16 Td
(2. Check your answers and mark homework as done on the portal.) Tj
0 -16 Td
(3. In case of any query, click 'Ask Doubt' to message the teacher.) Tj
0 -26 Td
(Questions:) Tj
0 -18 Td
(Q1. Define the core concepts discussed in today's class.) Tj
0 -18 Td
(Q2. Complete Exercises 1 through 5 from page 42.) Tj
0 -18 Td
(Q3. Practice handwriting and revise key vocabulary terms.) Tj
ET`;

  const streamLength = Buffer.byteLength(content, 'utf-8');
  const pdfString = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>
endobj
4 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
5 0 obj
<< /Length ${streamLength} >>
stream
${content}
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000266 00000 n 
0000000345 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
${400 + streamLength}
%%EOF`;

  return Buffer.from(pdfString, 'utf-8');
}

function isSundayOrSecondSaturday(dateInput: Date | string): boolean {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return false;
  if (date.getDay() === 0) return true; // Sunday
  if (date.getDay() === 6) {
    const dayOfMonth = date.getDate();
    if (dayOfMonth >= 8 && dayOfMonth <= 14) return true; // 2nd Saturday
  }
  return false;
}

function getTodaySchoolDate(): string {
  const now = new Date();
  const d = new Date(now);
  while (isSundayOrSecondSaturday(d)) {
    d.setDate(d.getDate() - 1);
  }
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

const DEFAULT_SERVER_STUDENT_CATEGORIES: Record<string, StudentCategoryType> = {};

function getDefaultDB(): PortalDatabase {
  const todayStr = getTodaySchoolDate();
  const completions: Record<string, Record<string, boolean>> = {};
  STUDENTS.forEach((st) => {
    completions[st.rollNo.toString()] = {
      english: false,
      twau: false,
      maths: false,
      hindi: false,
    };
  });

  return {
    homework: {
      english: {
        subject: 'english',
        subjectName: 'English',
        teacherName: "Ms. Riya Verma Ma'am",
        content: '',
        updatedAt: new Date().toISOString(),
        assignedDate: todayStr,
        attachments: [],
      },
      twau: {
        subject: 'twau',
        subjectName: 'TWAU',
        teacherName: "Mrs. Smriti Vats Ma'am",
        content: '',
        updatedAt: new Date().toISOString(),
        assignedDate: todayStr,
        attachments: [],
      },
      maths: {
        subject: 'maths',
        subjectName: 'Maths',
        teacherName: 'Mr. Umesh Kumar Chourasiya Sir',
        content: '',
        updatedAt: new Date().toISOString(),
        assignedDate: todayStr,
        attachments: [],
      },
      hindi: {
        subject: 'hindi',
        subjectName: 'Hindi',
        teacherName: 'Ms. Sakshi Baliyan',
        content: '',
        updatedAt: new Date().toISOString(),
        assignedDate: todayStr,
        attachments: [],
      },
    },
    categoryHomework: {
      english: {},
      twau: {},
      maths: {},
      hindi: {},
    },
    studentCategories: {},
    completions,
    doubts: [],
    teacherPasswords: { ...DEFAULT_TEACHER_PASSWORDS },
    studentPasswords: (() => {
      const sp: Record<string, string> = {};
      STUDENTS.forEach((st) => {
        sp[st.rollNo.toString()] = st.rollNo.toString();
      });
      return sp;
    })(),
    pdfFiles: [],
    avatars: {
      students: {},
      teachers: {},
    },
    homeworkHistory: [],
    completionHistory: [],
    announcements: [],
  };
}

let dbData: PortalDatabase;

function seedSamplePdfsIfEmpty(data: PortalDatabase) {
  if (!fs.existsSync(PDF_DIR)) {
    fs.mkdirSync(PDF_DIR, { recursive: true });
  }

  if (!data.pdfFiles) {
    data.pdfFiles = [];
  }
}

function seedHistoryIfEmpty(data: PortalDatabase) {
  if (!data.homeworkHistory) {
    data.homeworkHistory = [];
  }
  if (!data.completionHistory) {
    data.completionHistory = [];
  }
  if (!data.announcements) {
    data.announcements = [];
  }

  // Remove any legacy dummy/seeded homework history entries (user requested: "delete your all inbuilt hw")
  data.homeworkHistory = (data.homeworkHistory || []).filter((h) => {
    return !h.id.startsWith('seed_') && !h.id.endsWith('_28sep') && !h.id.endsWith('_27sep') && !h.id.endsWith('_26sep') && !h.id.endsWith('_curr');
  });

  data.completionHistory = (data.completionHistory || []).filter((c) => {
    return !c.id.startsWith('seed_');
  });

  // Ensure student categories initialized without forcing default types
  if (!data.studentCategories) {
    data.studentCategories = {};
  }

  // Ensure categoryHomework structure initialized
  if (!data.categoryHomework) {
    data.categoryHomework = {
      english: {},
      twau: {},
      maths: {},
      hindi: {},
    };
  }

  const todaySchoolDate = getTodaySchoolDate();

  // Reset any default inbuilt homework content to empty string and set date to today
  if (data.homework) {
    Object.keys(data.homework).forEach((subj) => {
      const hw = data.homework[subj];
      if (hw) {
        if (!hw.assignedDate || isSundayOrSecondSaturday(hw.assignedDate) || hw.assignedDate.includes('Aug 2026')) {
          hw.assignedDate = todaySchoolDate;
        }
      }
    });
  }
}

function loadDatabase(): PortalDatabase {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    if (!fs.existsSync(PDF_DIR)) {
      fs.mkdirSync(PDF_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_PATH)) {
      const raw = fs.readFileSync(DB_PATH, 'utf-8');
      const parsed: PortalDatabase = JSON.parse(raw);

      // Ensure all students exist in completions
      STUDENTS.forEach((st) => {
        if (!parsed.completions[st.rollNo.toString()]) {
          parsed.completions[st.rollNo.toString()] = { english: false, twau: false, maths: false, hindi: false };
        }
      });

      // Ensure teacher passwords map exists
      if (!parsed.teacherPasswords) {
        parsed.teacherPasswords = { ...DEFAULT_TEACHER_PASSWORDS };
      } else {
        Object.keys(DEFAULT_TEACHER_PASSWORDS).forEach((subj) => {
          if (!parsed.teacherPasswords![subj]) {
            parsed.teacherPasswords![subj] = DEFAULT_TEACHER_PASSWORDS[subj];
          }
        });
      }

      // Ensure student passwords map exists (defaulting to their roll number string)
      if (!parsed.studentPasswords) {
        parsed.studentPasswords = {};
      }
      STUDENTS.forEach((st) => {
        if (!parsed.studentPasswords![st.rollNo.toString()]) {
          parsed.studentPasswords![st.rollNo.toString()] = st.rollNo.toString();
        }
      });

      // Ensure attachments array exists on all subjects
      Object.keys(parsed.homework).forEach((subj) => {
        if (!parsed.homework[subj].attachments) {
          parsed.homework[subj].attachments = [];
        }
      });

      if (!parsed.pdfFiles) {
        parsed.pdfFiles = [];
      }

      if (!parsed.sessions) {
        parsed.sessions = {};
      }

      if (!parsed.avatars) {
        parsed.avatars = { students: {}, teachers: {} };
      }
      if (!parsed.avatars.students) parsed.avatars.students = {};
      if (!parsed.avatars.teachers) parsed.avatars.teachers = {};

      seedSamplePdfsIfEmpty(parsed);
      migrateAvatarsToDisk(parsed);
      seedHistoryIfEmpty(parsed);
      return parsed;
    }
  } catch (err) {
    console.error('Error reading database file, using default:', err);
  }
  const defaultDB = getDefaultDB();
  defaultDB.sessions = {};
  seedSamplePdfsIfEmpty(defaultDB);
  seedHistoryIfEmpty(defaultDB);
  saveDatabase(defaultDB);
  return defaultDB;
}

function saveDatabase(data: PortalDatabase) {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving database file:', err);
  }
}

dbData = loadDatabase();

// In-memory lockout management: 3 attempts -> 15 minutes lockout
interface AttemptRecord {
  failedAttempts: number;
  lockedUntil: number | null; // epoch ms
}

const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes = 900,000 ms
const MAX_ATTEMPTS = 3;

const studentAttempts: Map<string, AttemptRecord> = new Map();
const teacherAttempts: Map<string, AttemptRecord> = new Map();

function getClientIdentifier(req: Request): string {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'default_client';
  return Array.isArray(ip) ? ip[0] : ip;
}

function checkLockout(map: Map<string, AttemptRecord>, key: string): { isLocked: boolean; remainingSeconds: number; attemptsLeft: number } {
  const record = map.get(key);
  if (!record) {
    return { isLocked: false, remainingSeconds: 0, attemptsLeft: MAX_ATTEMPTS };
  }

  const now = Date.now();
  if (record.lockedUntil) {
    if (now < record.lockedUntil) {
      const remainingSeconds = Math.ceil((record.lockedUntil - now) / 1000);
      return { isLocked: true, remainingSeconds, attemptsLeft: 0 };
    } else {
      // Lock has expired, reset attempts
      record.failedAttempts = 0;
      record.lockedUntil = null;
      map.set(key, record);
    }
  }

  const attemptsLeft = Math.max(0, MAX_ATTEMPTS - record.failedAttempts);
  return { isLocked: false, remainingSeconds: 0, attemptsLeft };
}

function recordFailedAttempt(map: Map<string, AttemptRecord>, key: string): { isLocked: boolean; remainingSeconds: number; attemptsLeft: number } {
  let record = map.get(key);
  if (!record) {
    record = { failedAttempts: 0, lockedUntil: null };
  }

  record.failedAttempts += 1;
  if (record.failedAttempts >= MAX_ATTEMPTS) {
    record.lockedUntil = Date.now() + LOCKOUT_DURATION_MS;
    map.set(key, record);
    return { isLocked: true, remainingSeconds: Math.ceil(LOCKOUT_DURATION_MS / 1000), attemptsLeft: 0 };
  }

  map.set(key, record);
  return { isLocked: false, remainingSeconds: 0, attemptsLeft: MAX_ATTEMPTS - record.failedAttempts };
}

function resetAttempts(map: Map<string, AttemptRecord>, key: string) {
  map.delete(key);
}

// Active session token store
interface SessionInfo {
  token: string;
  role: 'student' | 'teacher';
  rollNo?: number;
  studentName?: string;
  teacherId?: string;
  teacherName?: string;
  subject?: string;
  avatar?: string;
  createdAt: number;
}

const activeSessions = new Map<string, SessionInfo>();

// Re-hydrate in-memory sessions from database
if (dbData && dbData.sessions) {
  Object.entries(dbData.sessions).forEach(([token, sess]) => {
    activeSessions.set(token, sess);
  });
}

function createSession(data: Omit<SessionInfo, 'token' | 'createdAt'>): string {
  const token = `tok_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  const session: SessionInfo = {
    ...data,
    token,
    createdAt: Date.now(),
  };
  activeSessions.set(token, session);
  if (!dbData.sessions) dbData.sessions = {};
  dbData.sessions[token] = session;
  saveDatabase(dbData);
  return token;
}

function getSession(req: Request): SessionInfo | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.substring(7).trim();
  let session = activeSessions.get(token);
  if (!session && dbData && dbData.sessions && dbData.sessions[token]) {
    session = dbData.sessions[token];
    activeSessions.set(token, session);
  }
  return session || null;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // === API ROUTES ===

  // 1. Health check
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // 2. Lock Status Check
  app.get('/api/auth/lock-status', (req: Request, res: Response) => {
    const role = req.query.role as string;
    const clientId = getClientIdentifier(req);
    const map = role === 'teacher' ? teacherAttempts : studentAttempts;
    const status = checkLockout(map, clientId);
    res.json(status);
  });

  // 3. Student Login via Password (Replaced roll no. direct entry)
  app.post('/api/auth/student-login', (req: Request, res: Response) => {
    const { password, rollNo } = req.body;
    const clientId = getClientIdentifier(req);

    // Check lockout first
    const lockStatus = checkLockout(studentAttempts, clientId);
    if (lockStatus.isLocked) {
      res.status(423).json({
        error: `Login locked due to 3 incorrect attempts. Please try again in ${Math.ceil(lockStatus.remainingSeconds / 60)} minute(s).`,
        lockStatus,
      });
      return;
    }

    const inputPass = String(password ?? rollNo ?? '').trim();
    if (!inputPass) {
      const updatedLock = recordFailedAttempt(studentAttempts, clientId);
      res.status(400).json({
        error: 'Please enter your Student Password.',
        lockStatus: updatedLock,
      });
      return;
    }

    if (!dbData.studentPasswords) {
      dbData.studentPasswords = {};
      STUDENTS.forEach((st) => {
        dbData.studentPasswords![st.rollNo.toString()] = st.rollNo.toString();
      });
    }

    // Match password against student passwords (case-insensitive for ease of student login)
    let matchedStudent: StudentRecord | undefined;
    for (const [rStr, sPass] of Object.entries(dbData.studentPasswords)) {
      if (sPass.toLowerCase() === inputPass.toLowerCase()) {
        const rNum = parseInt(rStr, 10);
        matchedStudent = STUDENTS.find((s) => s.rollNo === rNum);
        if (matchedStudent) break;
      }
    }

    // Fallback: If not found, check if input is a valid roll number whose password hasn't been changed
    if (!matchedStudent) {
      const rNum = parseInt(inputPass, 10);
      if (!isNaN(rNum) && rNum >= 501 && rNum <= 541) {
        const existingPass = dbData.studentPasswords[rNum.toString()];
        if (!existingPass || existingPass === inputPass) {
          matchedStudent = STUDENTS.find((s) => s.rollNo === rNum);
        }
      }
    }

    if (!matchedStudent) {
      const updatedLock = recordFailedAttempt(studentAttempts, clientId);
      res.status(401).json({
        error: "Incorrect Student Password. If you forgot your password, please ask Smriti Ma'am in school.",
        lockStatus: updatedLock,
      });
      return;
    }

    // Success: reset failed attempts
    resetAttempts(studentAttempts, clientId);
    const userAvatar = dbData.avatars?.students?.[matchedStudent.rollNo.toString()] || '';
    const token = createSession({
      role: 'student',
      rollNo: matchedStudent.rollNo,
      studentName: matchedStudent.name,
      avatar: userAvatar,
    });

    res.json({
      success: true,
      token,
      student: {
        ...matchedStudent,
        category: dbData.studentCategories?.[matchedStudent.rollNo.toString()] || DEFAULT_SERVER_STUDENT_CATEGORIES[matchedStudent.rollNo.toString()] || 'progressive',
        avatar: userAvatar,
      },
    });
  });

  // 3b. Student Change Password
  app.post('/api/auth/student-change-password', (req: Request, res: Response) => {
    const { rollNo, currentPassword, newPassword } = req.body;
    const clientId = getClientIdentifier(req);

    // Check lockout first
    const lockStatus = checkLockout(studentAttempts, clientId);
    if (lockStatus.isLocked) {
      res.status(423).json({
        error: `Action locked due to 3 incorrect attempts. Please try again in ${Math.ceil(lockStatus.remainingSeconds / 60)} minute(s).`,
        lockStatus,
      });
      return;
    }

    if (!currentPassword || !newPassword) {
      res.status(400).json({
        error: 'Please enter your current password and your new password.',
      });
      return;
    }

    if (!dbData.studentPasswords) {
      dbData.studentPasswords = {};
      STUDENTS.forEach((st) => {
        dbData.studentPasswords![st.rollNo.toString()] = st.rollNo.toString();
      });
    }

    const trimmedCurrent = String(currentPassword).trim();
    const trimmedNew = String(newPassword).trim();

    // Identify which student is changing password
    let studentToUpdate: StudentRecord | undefined;
    if (rollNo) {
      const rNum = parseInt(rollNo, 10);
      studentToUpdate = STUDENTS.find((s) => s.rollNo === rNum);
    } else {
      // Find student matching current password
      for (const [rStr, sPass] of Object.entries(dbData.studentPasswords)) {
        if (sPass.toLowerCase() === trimmedCurrent.toLowerCase()) {
          const rNum = parseInt(rStr, 10);
          studentToUpdate = STUDENTS.find((s) => s.rollNo === rNum);
          if (studentToUpdate) break;
        }
      }
    }

    if (!studentToUpdate) {
      const updatedLock = recordFailedAttempt(studentAttempts, clientId);
      res.status(401).json({
        error: "Incorrect current password. (Default password is your Roll Number e.g. 501). If you forgot it, ask Smriti Ma'am in school.",
        lockStatus: updatedLock,
      });
      return;
    }

    const expectedCurrent = dbData.studentPasswords[studentToUpdate.rollNo.toString()] || studentToUpdate.rollNo.toString();
    if (trimmedCurrent.toLowerCase() !== expectedCurrent.toLowerCase()) {
      const updatedLock = recordFailedAttempt(studentAttempts, clientId);
      res.status(401).json({
        error: `Incorrect current password for ${studentToUpdate.name}. (Default is Roll No. ${studentToUpdate.rollNo}).`,
        lockStatus: updatedLock,
      });
      return;
    }

    if (trimmedNew.length < 2) {
      res.status(400).json({
        error: 'New password must be at least 2 characters long.',
      });
      return;
    }

    if (trimmedNew.toLowerCase() === expectedCurrent.toLowerCase()) {
      res.status(400).json({
        error: 'New password cannot be identical to your old password.',
      });
      return;
    }

    // Success: Update password and persist
    dbData.studentPasswords[studentToUpdate.rollNo.toString()] = trimmedNew;
    saveDatabase(dbData);
    resetAttempts(studentAttempts, clientId);

    res.json({
      success: true,
      message: `Password changed successfully for ${studentToUpdate.name} (Roll ${studentToUpdate.rollNo})! You can now log in using your new password.`,
      student: studentToUpdate,
    });
  });

  // 3c. Restore Session (Auto-login returning student or teacher without password prompt)
  app.post('/api/auth/restore-session', (req: Request, res: Response) => {
    const { role, rollNo, subject, token: clientToken, avatar: clientAvatar } = req.body;

    if (!dbData.avatars) {
      dbData.avatars = { students: {}, teachers: {} };
    }
    if (!dbData.avatars.students) dbData.avatars.students = {};
    if (!dbData.avatars.teachers) dbData.avatars.teachers = {};

    if (role === 'student' && rollNo) {
      const rNum = parseInt(rollNo, 10);
      const student = STUDENTS.find((s) => s.rollNo === rNum);
      if (!student) {
        res.status(404).json({ success: false, error: 'Student not found.' });
        return;
      }

      let userAvatar = dbData.avatars.students[rNum.toString()] || '';
      if (!userAvatar && clientAvatar) {
        dbData.avatars.students[rNum.toString()] = clientAvatar;
        userAvatar = clientAvatar;
        saveDatabase(dbData);
      }

      const token = clientToken && typeof clientToken === 'string' && clientToken.startsWith('tok_')
        ? clientToken
        : createSession({
            role: 'student',
            rollNo: student.rollNo,
            studentName: student.name,
            avatar: userAvatar,
          });

      const sessionObj: SessionInfo = {
        role: 'student',
        rollNo: student.rollNo,
        studentName: student.name,
        avatar: userAvatar,
        token,
        createdAt: Date.now(),
      };

      activeSessions.set(token, sessionObj);
      if (!dbData.sessions) dbData.sessions = {};
      dbData.sessions[token] = sessionObj;
      saveDatabase(dbData);

      res.json({
        success: true,
        token,
        session: sessionObj,
        student: {
          ...student,
          category: dbData.studentCategories?.[student.rollNo.toString()] || DEFAULT_SERVER_STUDENT_CATEGORIES[student.rollNo.toString()] || 'progressive',
          avatar: userAvatar,
        },
      });
      return;
    }

    if (role === 'teacher' && subject) {
      const subjKey = String(subject).toLowerCase();
      const teacher = TEACHER_INFO_BY_SUBJECT[subjKey];
      if (!teacher) {
        res.status(404).json({ success: false, error: 'Teacher not found.' });
        return;
      }

      let userAvatar = dbData.avatars.teachers[subjKey] || '';
      if (!userAvatar && clientAvatar) {
        dbData.avatars.teachers[subjKey] = clientAvatar;
        userAvatar = clientAvatar;
        saveDatabase(dbData);
      }

      const token = clientToken && typeof clientToken === 'string' && clientToken.startsWith('tok_')
        ? clientToken
        : createSession({
            role: 'teacher',
            teacherId: teacher.id,
            teacherName: teacher.name,
            subject: teacher.subject,
            avatar: userAvatar,
          });

      const sessionObj: SessionInfo = {
        role: 'teacher',
        teacherId: teacher.id,
        teacherName: teacher.name,
        subject: teacher.subject,
        avatar: userAvatar,
        token,
        createdAt: Date.now(),
      };

      activeSessions.set(token, sessionObj);
      if (!dbData.sessions) dbData.sessions = {};
      dbData.sessions[token] = sessionObj;
      saveDatabase(dbData);

      res.json({
        success: true,
        token,
        session: sessionObj,
        teacher: {
          ...teacher,
          avatar: userAvatar,
        },
      });
      return;
    }

    res.status(400).json({ success: false, error: 'Invalid restore session parameters.' });
  });

  // 4. Teacher Login
  app.post('/api/auth/teacher-login', (req: Request, res: Response) => {
    const { password } = req.body;
    const clientId = getClientIdentifier(req);

    // Check lockout first
    const lockStatus = checkLockout(teacherAttempts, clientId);
    if (lockStatus.isLocked) {
      res.status(423).json({
        error: `Teacher login locked due to 3 incorrect attempts. Please try again in ${Math.ceil(lockStatus.remainingSeconds / 60)} minute(s).`,
        lockStatus,
      });
      return;
    }

    if (!password || typeof password !== 'string') {
      const updatedLock = recordFailedAttempt(teacherAttempts, clientId);
      res.status(400).json({
        error: 'Please enter Teacher Special Password.',
        lockStatus: updatedLock,
      });
      return;
    }

    const trimmedPass = password.trim();

    // Check passwords from dbData.teacherPasswords
    const passwords = dbData.teacherPasswords || DEFAULT_TEACHER_PASSWORDS;
    let matchedSubject: string | null = null;

    for (const [subj, pass] of Object.entries(passwords)) {
      if (pass === trimmedPass) {
        matchedSubject = subj;
        break;
      }
    }

    if (!matchedSubject || !TEACHER_INFO_BY_SUBJECT[matchedSubject]) {
      const updatedLock = recordFailedAttempt(teacherAttempts, clientId);
      res.status(401).json({
        error: 'Incorrect Teacher Special Password.',
        lockStatus: updatedLock,
      });
      return;
    }

    const teacherAccount = TEACHER_INFO_BY_SUBJECT[matchedSubject];

    // Success: reset attempts
    resetAttempts(teacherAttempts, clientId);
    const userAvatar = dbData.avatars?.teachers?.[teacherAccount.subject] || '';
    const token = createSession({
      role: 'teacher',
      teacherId: teacherAccount.id,
      teacherName: teacherAccount.name,
      subject: teacherAccount.subject,
      avatar: userAvatar,
    });

    res.json({
      success: true,
      token,
      teacher: {
        id: teacherAccount.id,
        name: teacherAccount.name,
        subject: teacherAccount.subject,
        role: 'teacher',
        avatar: userAvatar,
      },
    });
  });

  // 4b. Change Teacher Password
  app.post('/api/auth/change-password', (req: Request, res: Response) => {
    const { subject, oldPassword, newPassword } = req.body;
    const clientId = getClientIdentifier(req);

    // Check lockout first
    const lockStatus = checkLockout(teacherAttempts, clientId);
    if (lockStatus.isLocked) {
      res.status(423).json({
        error: `Action locked due to 3 incorrect attempts. Please try again in ${Math.ceil(lockStatus.remainingSeconds / 60)} minute(s).`,
        lockStatus,
      });
      return;
    }

    if (!subject || !oldPassword || !newPassword) {
      res.status(400).json({
        error: 'Please select subject, enter old password and new password.',
      });
      return;
    }

    const validSubjects = ['english', 'twau', 'maths', 'hindi'];
    if (!validSubjects.includes(subject)) {
      res.status(400).json({ error: 'Invalid subject selected.' });
      return;
    }

    if (!dbData.teacherPasswords) {
      dbData.teacherPasswords = { ...DEFAULT_TEACHER_PASSWORDS };
    }

    const currentPass = dbData.teacherPasswords[subject] || DEFAULT_TEACHER_PASSWORDS[subject];
    const trimmedOld = String(oldPassword).trim();
    const trimmedNew = String(newPassword).trim();

    if (trimmedOld !== currentPass) {
      const updatedLock = recordFailedAttempt(teacherAttempts, clientId);
      res.status(401).json({
        error: `Incorrect current password for ${TEACHER_INFO_BY_SUBJECT[subject]?.name || subject}.`,
        lockStatus: updatedLock,
      });
      return;
    }

    if (trimmedNew.length < 3) {
      res.status(400).json({
        error: 'New password must be at least 3 characters long.',
      });
      return;
    }

    if (trimmedNew === currentPass) {
      res.status(400).json({
        error: 'New password cannot be the same as your old password.',
      });
      return;
    }

    // Success: Update password and persist
    dbData.teacherPasswords[subject] = trimmedNew;
    saveDatabase(dbData);
    resetAttempts(teacherAttempts, clientId);

    const teacherInfo = TEACHER_INFO_BY_SUBJECT[subject];
    res.json({
      success: true,
      message: `Password updated successfully for ${teacherInfo?.name} (${teacherInfo?.subjectName})!`,
      subject,
    });
  });

  // 4c. Class Passwords Directory (EXCLUSIVELY FOR SMRITI MA'AM)
  app.get('/api/teacher/class-passwords', (req: Request, res: Response) => {
    const session = getSession(req);
    if (!session || session.role !== 'teacher') {
      res.status(401).json({ error: 'Teacher authentication required.' });
      return;
    }

    const isSmriti =
      session.subject === 'twau' ||
      session.teacherId === 'teacher_twau' ||
      Boolean(session.teacherName && session.teacherName.toLowerCase().includes('smriti'));

    if (!isSmriti) {
      res.status(403).json({
        error: "Restricted: Only Smriti Ma'am is authorized to access the Class 5 passwords directory.",
      });
      return;
    }

    if (!dbData.studentPasswords) {
      dbData.studentPasswords = {};
      STUDENTS.forEach((st) => {
        dbData.studentPasswords![st.rollNo.toString()] = st.rollNo.toString();
      });
    }

    const directory = STUDENTS.map((st) => {
      const currentPassword = dbData.studentPasswords?.[st.rollNo.toString()] || st.rollNo.toString();
      return {
        rollNo: st.rollNo,
        name: st.name,
        dob: st.dob,
        class: st.class,
        password: currentPassword,
        isDefault: currentPassword === st.rollNo.toString(),
      };
    });

    res.json({
      success: true,
      students: directory,
      authorizedTeacher: session.teacherName,
    });
  });

  // 4d. Smriti Ma'am: Reset or Update Student Password
  app.post('/api/teacher/reset-student-password', (req: Request, res: Response) => {
    const session = getSession(req);
    if (!session || session.role !== 'teacher') {
      res.status(401).json({ error: 'Teacher authentication required.' });
      return;
    }

    const isSmriti =
      session.subject === 'twau' ||
      session.teacherId === 'teacher_twau' ||
      Boolean(session.teacherName && session.teacherName.toLowerCase().includes('smriti'));

    if (!isSmriti) {
      res.status(403).json({
        error: "Restricted: Only Smriti Ma'am is authorized to reset student passwords.",
      });
      return;
    }

    const { rollNo, newPassword } = req.body;
    const rNum = parseInt(rollNo, 10);
    const student = STUDENTS.find((s) => s.rollNo === rNum);

    if (!student) {
      res.status(404).json({ error: 'Student not found.' });
      return;
    }

    if (!dbData.studentPasswords) {
      dbData.studentPasswords = {};
    }

    // If newPassword provided use it, otherwise reset to roll number
    const updatedPass = newPassword ? String(newPassword).trim() : student.rollNo.toString();
    dbData.studentPasswords[student.rollNo.toString()] = updatedPass;
    saveDatabase(dbData);

    res.json({
      success: true,
      message: `Password for ${student.name} (Roll ${student.rollNo}) has been updated to "${updatedPass}".`,
      student: {
        rollNo: student.rollNo,
        name: student.name,
        password: updatedPass,
      },
    });
  });

  // 5. Get Student Roster
  app.get('/api/students', (req: Request, res: Response) => {
    const studentsWithAvatars = STUDENTS.map((st) => ({
      ...st,
      avatar: dbData.avatars?.students?.[st.rollNo.toString()] || '',
      category: dbData.studentCategories?.[st.rollNo.toString()] || undefined,
    }));
    res.json(studentsWithAvatars);
  });

  // 5b. Get All Student Categories
  app.get('/api/student-categories', (req: Request, res: Response) => {
    if (!dbData.studentCategories) {
      dbData.studentCategories = {};
    }
    res.json({
      success: true,
      categories: dbData.studentCategories,
    });
  });

  // 5c. Update a Single Student's Category (Teacher only)
  app.post('/api/student-categories/update', (req: Request, res: Response) => {
    const session = getSession(req);
    if (!session || session.role !== 'teacher') {
      res.status(403).json({ error: 'Unauthorized: Teacher access required.' });
      return;
    }
    const { rollNo, category } = req.body;
    if (!rollNo) {
      res.status(400).json({ error: 'Valid rollNo is required.' });
      return;
    }

    if (!dbData.studentCategories) dbData.studentCategories = {};
    if (!category || category === 'none' || category === 'unassigned') {
      delete dbData.studentCategories[rollNo.toString()];
    } else if (['beginner', 'progressive', 'proficient'].includes(category)) {
      dbData.studentCategories[rollNo.toString()] = category;
    } else {
      res.status(400).json({ error: 'Category must be beginner, progressive, proficient, or unassigned.' });
      return;
    }
    saveDatabase(dbData);

    res.json({
      success: true,
      rollNo,
      category: dbData.studentCategories[rollNo.toString()] || null,
      categories: dbData.studentCategories,
    });
  });

  // 5d. Bulk Update Student Categories (Teacher only)
  app.post('/api/student-categories/bulk', (req: Request, res: Response) => {
    const session = getSession(req);
    if (!session || session.role !== 'teacher') {
      res.status(403).json({ error: 'Unauthorized: Teacher access required.' });
      return;
    }
    const { updates } = req.body;
    if (!Array.isArray(updates)) {
      res.status(400).json({ error: 'Updates must be an array of { rollNo, category }' });
      return;
    }

    if (!dbData.studentCategories) dbData.studentCategories = {};
    updates.forEach((u: any) => {
      if (u.rollNo) {
        if (!u.category || u.category === 'none' || u.category === 'unassigned') {
          delete dbData.studentCategories![u.rollNo.toString()];
        } else if (['beginner', 'progressive', 'proficient'].includes(u.category)) {
          dbData.studentCategories![u.rollNo.toString()] = u.category;
        }
      }
    });
    saveDatabase(dbData);

    res.json({
      success: true,
      categories: dbData.studentCategories,
    });
  });

  // 5e. Get Category Homework map
  app.get('/api/homework/categories', (req: Request, res: Response) => {
    res.json({
      success: true,
      categoryHomework: dbData.categoryHomework || {},
    });
  });

  // 6. Get Homework for all subjects (category-aware)
  app.get('/api/homework', (req: Request, res: Response) => {
    const session = getSession(req);
    const { rollNo, category } = req.query;

    let targetCategory: string | undefined;
    if (category && typeof category === 'string') {
      targetCategory = category;
    } else if (session && session.role === 'student' && session.rollNo) {
      targetCategory = dbData.studentCategories?.[session.rollNo.toString()] || 'progressive';
    } else if (rollNo && typeof rollNo === 'string') {
      targetCategory = dbData.studentCategories?.[rollNo] || 'progressive';
    }

    const result: Record<string, HomeworkRecord> = {};
    const subjects = ['english', 'twau', 'maths', 'hindi'];
    const todaySchoolDate = getTodaySchoolDate();

    subjects.forEach((subj) => {
      const defaultHw = dbData.homework[subj] || {
        subject: subj,
        subjectName: subj.toUpperCase(),
        teacherName: 'Teacher',
        content: '',
        updatedAt: new Date().toISOString(),
        assignedDate: todaySchoolDate,
        attachments: [],
        category: 'all',
      };

      if (targetCategory && targetCategory !== 'all') {
        const catHw = dbData.categoryHomework?.[subj]?.[targetCategory];
        if (catHw && catHw.content && catHw.content.trim()) {
          result[subj] = catHw;
          return;
        }
      }

      result[subj] = defaultHw;
    });

    res.json(result);
  });

  // 7. Update Homework (Teacher only)
  app.post('/api/homework', (req: Request, res: Response) => {
    const session = getSession(req);
    if (!session || session.role !== 'teacher') {
      res.status(403).json({ error: 'Unauthorized: Only teachers can update homework.' });
      return;
    }

    const { subject, content, attachments, category, assignedDate } = req.body;
    if (!subject || content === undefined || typeof content !== 'string') {
      res.status(400).json({ error: 'Subject and content are required.' });
      return;
    }

    // Check if teacher is assigned to this subject
    if (session.subject && session.subject !== subject) {
      res.status(403).json({ error: `You are only authorized to update homework for ${session.subject.toUpperCase()}.` });
      return;
    }

    const targetCategory: 'all' | StudentCategoryType =
      category && ['beginner', 'progressive', 'proficient'].includes(category) ? category : 'all';

    let effectiveAssignedDate = (assignedDate && typeof assignedDate === 'string' && assignedDate.trim())
      ? assignedDate.trim()
      : getTodaySchoolDate();

    // Prevent saving on Sunday or 2nd Saturday
    if (isSundayOrSecondSaturday(effectiveAssignedDate)) {
      effectiveAssignedDate = getTodaySchoolDate();
    }

    const existingHW = dbData.homework[subject];

    // Handle attachments array
    let currentAttachments = existingHW?.attachments || [];
    if (attachments !== undefined && Array.isArray(attachments)) {
      currentAttachments = attachments;
    }

    const savedHW: HomeworkRecord = {
      subject,
      subjectName: existingHW ? existingHW.subjectName : subject.toUpperCase(),
      teacherName: session.teacherName || (existingHW ? existingHW.teacherName : 'Teacher'),
      content: content.trim(),
      updatedAt: new Date().toISOString(),
      assignedDate: effectiveAssignedDate,
      attachments: currentAttachments,
      category: targetCategory,
    };

    // Save into categoryHomework map
    if (!dbData.categoryHomework) dbData.categoryHomework = { english: {}, twau: {}, maths: {}, hindi: {} };
    if (!dbData.categoryHomework[subject]) dbData.categoryHomework[subject] = {};
    dbData.categoryHomework[subject][targetCategory] = savedHW;

    // If targetCategory is 'all' or general homework, also update dbData.homework[subject]
    if (targetCategory === 'all' || !dbData.homework[subject]?.content) {
      dbData.homework[subject] = savedHW;
    }

    // Record in persistent homework history (sorted latest to oldest)
    if (!dbData.homeworkHistory) dbData.homeworkHistory = [];
    const historyEntry: HomeworkHistoryRecord = {
      id: `hw_${subject}_${targetCategory}_${Date.now()}`,
      subject,
      subjectName: savedHW.subjectName,
      teacherName: savedHW.teacherName,
      content: savedHW.content,
      assignedDate: effectiveAssignedDate,
      createdAt: savedHW.updatedAt,
      attachments: currentAttachments,
      category: targetCategory,
    };

    // If an entry for this subject, category, and date exists, update it, else unshift
    const existingHistIdx = dbData.homeworkHistory.findIndex(
      (h) => h.subject === subject && h.assignedDate === effectiveAssignedDate && (h.category || 'all') === targetCategory
    );
    if (existingHistIdx >= 0) {
      dbData.homeworkHistory[existingHistIdx] = {
        ...dbData.homeworkHistory[existingHistIdx],
        content: savedHW.content,
        teacherName: savedHW.teacherName,
        createdAt: savedHW.updatedAt,
        attachments: currentAttachments,
      };
    } else {
      dbData.homeworkHistory.unshift(historyEntry);
    }

    saveDatabase(dbData);
    res.json({
      success: true,
      homework: dbData.homework[subject],
      categoryHomework: dbData.categoryHomework[subject],
      historyItem: historyEntry,
    });
  });

  // 7b. Get Homework History (By Date, Subject, Category - latest to oldest, no Sundays/2nd Saturdays)
  app.get('/api/homework/history', (req: Request, res: Response) => {
    const { subject, date, category } = req.query;
    let list = dbData.homeworkHistory || [];

    // Filter out Sundays and 2nd Saturdays
    list = list.filter((h) => !isSundayOrSecondSaturday(h.assignedDate));

    if (subject && typeof subject === 'string' && subject !== 'all') {
      list = list.filter((h) => h.subject === subject);
    }
    if (date && typeof date === 'string' && date !== 'all') {
      list = list.filter((h) => h.assignedDate === date);
    }
    if (category && typeof category === 'string' && category !== 'all') {
      list = list.filter((h) => (h.category || 'all') === category);
    }

    // Sort latest to oldest
    list.sort((a, b) => {
      const timeA = new Date(a.createdAt || a.assignedDate).getTime();
      const timeB = new Date(b.createdAt || b.assignedDate).getTime();
      return timeB - timeA;
    });

    const totalStudents = STUDENTS.length;
    const historyWithStats = list.map((item) => {
      let doneCount = 0;
      let targetCount = totalStudents;

      if (item.category && item.category !== 'all') {
        targetCount = STUDENTS.filter(
          (s) => (dbData.studentCategories?.[s.rollNo.toString()] || 'progressive') === item.category
        ).length;
      }

      const todayStr = getTodaySchoolDate();
      if (item.assignedDate === todayStr) {
        STUDENTS.forEach((s) => {
          const sCat = dbData.studentCategories?.[s.rollNo.toString()] || 'progressive';
          if (!item.category || item.category === 'all' || item.category === sCat) {
            const comp = dbData.completions?.[s.rollNo.toString()];
            if (comp && comp[item.subject]) doneCount++;
          }
        });
      } else {
        const rollDoneSet = new Set<number>();
        (dbData.completionHistory || []).forEach((c) => {
          if (c.date === item.assignedDate && c.subject === item.subject && c.completed) {
            const sCat = dbData.studentCategories?.[c.rollNo.toString()] || 'progressive';
            if (!item.category || item.category === 'all' || item.category === sCat) {
              rollDoneSet.add(c.rollNo);
            }
          }
        });
        doneCount = rollDoneSet.size;
      }
      return {
        ...item,
        completionStats: {
          totalStudents: targetCount,
          doneStudents: doneCount,
        },
      };
    });

    res.json({
      success: true,
      history: historyWithStats,
    });
  });

  // 7c. Delete Homework History Item (Teacher only)
  app.delete('/api/homework/history/:id', (req: Request, res: Response) => {
    const session = getSession(req);
    if (!session || session.role !== 'teacher') {
      res.status(403).json({ error: 'Unauthorized: Teacher access required.' });
      return;
    }
    const id = req.params.id;
    if (dbData.homeworkHistory) {
      dbData.homeworkHistory = dbData.homeworkHistory.filter((h) => h.id !== id);
      saveDatabase(dbData);
    }
    res.json({ success: true, message: 'Homework history record removed.' });
  });

  // 7b. Upload File (PDF or Image) (Teacher only)
  app.post('/api/files/upload', (req: Request, res: Response) => {
    const session = getSession(req);
    if (!session || session.role !== 'teacher') {
      res.status(403).json({ error: 'Unauthorized: Only teachers can upload worksheets or images.' });
      return;
    }

    const { fileName, title, subject, dataUrl, attachToHomework } = req.body;

    if (!fileName || !dataUrl) {
      res.status(400).json({ error: 'File name and file data are required.' });
      return;
    }

    const targetSubject = subject || session.subject || 'general';

    // Check file type: Image vs PDF vs Doc
    const lowerName = fileName.toLowerCase();
    const isImageExt = /\.(jpg|jpeg|png|webp|gif|svg|bmp)$/i.test(lowerName);
    const isImageData = typeof dataUrl === 'string' && dataUrl.startsWith('data:image/');
    const isPdfExt = lowerName.endsWith('.pdf');
    const isPdfData = typeof dataUrl === 'string' && (dataUrl.startsWith('data:application/pdf') || dataUrl.startsWith('data:application/octet-stream'));

    let fileType: 'pdf' | 'image' | 'file' = 'file';
    let mimeType = 'application/octet-stream';

    if (isImageExt || isImageData) {
      fileType = 'image';
      if (lowerName.endsWith('.png') || dataUrl.startsWith('data:image/png')) mimeType = 'image/png';
      else if (lowerName.endsWith('.webp') || dataUrl.startsWith('data:image/webp')) mimeType = 'image/webp';
      else if (lowerName.endsWith('.gif') || dataUrl.startsWith('data:image/gif')) mimeType = 'image/gif';
      else if (lowerName.endsWith('.svg') || dataUrl.startsWith('data:image/svg+xml')) mimeType = 'image/svg+xml';
      else mimeType = 'image/jpeg';
    } else if (isPdfExt || isPdfData) {
      fileType = 'pdf';
      mimeType = 'application/pdf';
    } else {
      fileType = 'file';
      mimeType = 'application/octet-stream';
    }

    try {
      const base64Index = dataUrl.indexOf(';base64,');
      const base64Data = base64Index !== -1 ? dataUrl.substring(base64Index + 8) : dataUrl;
      const fileBuffer = Buffer.from(base64Data, 'base64');

      if (fileBuffer.length === 0) {
        res.status(400).json({ error: 'Uploaded file is empty.' });
        return;
      }

      if (fileBuffer.length > 30 * 1024 * 1024) {
        res.status(400).json({ error: 'File size exceeds 30MB maximum limit.' });
        return;
      }

      if (!fs.existsSync(PDF_DIR)) {
        fs.mkdirSync(PDF_DIR, { recursive: true });
      }

      const fileId = `${fileType}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const safeFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
      const ext = path.extname(safeFileName) || (fileType === 'image' ? '.jpg' : fileType === 'pdf' ? '.pdf' : '');
      const diskFileName = `${fileId}${ext}`;
      const filePath = path.join(PDF_DIR, diskFileName);

      fs.writeFileSync(filePath, fileBuffer);

      const teacherInfo = TEACHER_INFO_BY_SUBJECT[targetSubject];
      const cleanTitle = (title && typeof title === 'string' && title.trim())
        ? title.trim()
        : fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');

      const newRecord: PdfDocumentRecord = {
        id: fileId,
        fileName: safeFileName,
        title: cleanTitle,
        subject: targetSubject,
        subjectName: teacherInfo?.subjectName || targetSubject.toUpperCase(),
        teacherName: session.teacherName || teacherInfo?.name || 'Teacher',
        fileSize: fileBuffer.length,
        fileSizeBytes: formatBytes(fileBuffer.length),
        uploadedAt: new Date().toISOString(),
        fileType,
        mimeType,
        homeworkSubject: attachToHomework ? targetSubject : undefined,
        downloadUrl: `/api/files/download/${fileId}`,
        viewUrl: `/api/files/view/${fileId}`,
        thumbnailUrl: fileType === 'image' ? `/api/files/view/${fileId}` : undefined,
      };

      if (!dbData.pdfFiles) {
        dbData.pdfFiles = [];
      }
      dbData.pdfFiles.unshift(newRecord);

      // If attachToHomework is set, add to subject homework attachments
      if (attachToHomework && dbData.homework[targetSubject]) {
        if (!dbData.homework[targetSubject].attachments) {
          dbData.homework[targetSubject].attachments = [];
        }
        dbData.homework[targetSubject].attachments!.push(newRecord);
      }

      saveDatabase(dbData);

      res.json({
        success: true,
        message: fileType === 'image' ? 'Image uploaded successfully!' : 'Worksheet uploaded successfully!',
        file: newRecord,
      });
    } catch (err: any) {
      console.error('Error saving upload:', err);
      res.status(500).json({ error: 'Failed to process and store file.' });
    }
  });

  // 7c. Get Worksheets / Files List (Students & Teachers)
  app.get('/api/files/pdf', (req: Request, res: Response) => {
    const subject = req.query.subject as string;
    const allFiles = dbData.pdfFiles || [];

    if (subject && subject !== 'all') {
      const filtered = allFiles.filter((f) => f.subject === subject || f.homeworkSubject === subject);
      res.json({ files: filtered });
      return;
    }

    res.json({ files: allFiles });
  });

  // Helper to locate stored file on disk
  function findDiskFilePath(id: string, record?: PdfDocumentRecord): string | null {
    if (fs.existsSync(PDF_DIR)) {
      const files = fs.readdirSync(PDF_DIR);
      const matched = files.find((f) => f.startsWith(id));
      if (matched) return path.join(PDF_DIR, matched);
    }
    const standardPath = path.join(PDF_DIR, `${id}.pdf`);
    if (fs.existsSync(standardPath)) return standardPath;
    return null;
  }

  // 7d. Download File (Students & Teachers)
  app.get('/api/files/download/:id', (req: Request, res: Response) => {
    const id = req.params.id;
    const fileRecord = (dbData.pdfFiles || []).find((f) => f.id === id);
    const filePath = findDiskFilePath(id, fileRecord);

    if (!filePath || !fs.existsSync(filePath)) {
      res.status(404).json({ error: 'Requested file was not found.' });
      return;
    }

    const downloadFileName = fileRecord ? fileRecord.fileName : `Class5_File_${id}`;
    const contentType = fileRecord?.mimeType || (fileRecord?.fileType === 'image' ? 'image/jpeg' : 'application/pdf');

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(downloadFileName)}"`);
    try {
      const stat = fs.statSync(filePath);
      res.setHeader('Content-Length', stat.size);
    } catch (e) {
      // ignore
    }

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });

  // 7e. Inline View File (Image / PDF) in Browser or Viewer
  app.get('/api/files/view/:id', (req: Request, res: Response) => {
    const id = req.params.id;
    const fileRecord = (dbData.pdfFiles || []).find((f) => f.id === id);
    const filePath = findDiskFilePath(id, fileRecord);

    if (!filePath || !fs.existsSync(filePath)) {
      res.status(404).json({ error: 'Requested file was not found.' });
      return;
    }

    const viewFileName = fileRecord ? fileRecord.fileName : `Class5_File_${id}`;
    const contentType = fileRecord?.mimeType || (fileRecord?.fileType === 'image' ? 'image/jpeg' : 'application/pdf');

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(viewFileName)}"`);
    try {
      const stat = fs.statSync(filePath);
      res.setHeader('Content-Length', stat.size);
    } catch (e) {
      // ignore
    }

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });

  // 7f. Delete File (Teacher only)
  app.post('/api/files/delete', (req: Request, res: Response) => {
    const session = getSession(req);
    if (!session || session.role !== 'teacher') {
      res.status(403).json({ error: 'Unauthorized: Only teachers can delete files.' });
      return;
    }

    const { id } = req.body;
    if (!id) {
      res.status(400).json({ error: 'File ID is required.' });
      return;
    }

    // Remove from dbData.pdfFiles
    if (dbData.pdfFiles) {
      dbData.pdfFiles = dbData.pdfFiles.filter((f) => f.id !== id);
    }

    // Remove from any homework attachments
    Object.keys(dbData.homework).forEach((subj) => {
      if (dbData.homework[subj].attachments) {
        dbData.homework[subj].attachments = dbData.homework[subj].attachments!.filter((f) => f.id !== id);
      }
    });

    // Remove file on disk
    try {
      if (fs.existsSync(PDF_DIR)) {
        const files = fs.readdirSync(PDF_DIR);
        const matches = files.filter((f) => f.startsWith(id));
        matches.forEach((f) => fs.unlinkSync(path.join(PDF_DIR, f)));
      }
    } catch (err) {
      console.warn('Could not delete file on disk:', err);
    }

    saveDatabase(dbData);
    res.json({ success: true, id });
  });

  // 8. Get Single Student's Completion
  app.get('/api/completion/student/:rollNo', (req: Request, res: Response) => {
    const rollNo = req.params.rollNo;
    const studentData = dbData.completions[rollNo] || { english: false, twau: false, maths: false, hindi: false };
    res.json({ rollNo: parseInt(rollNo, 10), ...studentData });
  });

  // 9. Toggle Student Homework Completion
  app.post('/api/completion/toggle', (req: Request, res: Response) => {
    const session = getSession(req);
    const { rollNo, subject, completed } = req.body;

    if (!rollNo || !subject) {
      res.status(400).json({ error: 'rollNo and subject are required.' });
      return;
    }

    const rollStr = rollNo.toString();

    // Security check: If student is logged in, they can only toggle their own roll number
    if (session && session.role === 'student' && session.rollNo !== parseInt(rollStr, 10)) {
      res.status(403).json({ error: 'Students can only toggle their own homework completion status.' });
      return;
    }

    if (!dbData.completions[rollStr]) {
      dbData.completions[rollStr] = { english: false, twau: false, maths: false, hindi: false };
    }

    const currentStatus = dbData.completions[rollStr][subject];
    const newStatus = typeof completed === 'boolean' ? completed : !currentStatus;

    dbData.completions[rollStr][subject] = newStatus;

    // Log completion event in history
    if (!dbData.completionHistory) dbData.completionHistory = [];
    const rollNum = parseInt(rollStr, 10);
    const matchedStudent = STUDENTS.find((s) => s.rollNo === rollNum);
    const sName = matchedStudent ? matchedStudent.name : `Roll ${rollNum}`;
    const todayStr = getTodaySchoolDate();
    const studentCategory = dbData.studentCategories?.[rollStr] || DEFAULT_SERVER_STUDENT_CATEGORIES[rollStr] || 'progressive';

    const compHistoryItem: CompletionHistoryRecord = {
      id: `comp_${rollStr}_${subject}_${Date.now()}`,
      rollNo: rollNum,
      studentName: sName,
      subject,
      subjectName: dbData.homework[subject]?.subjectName || subject.toUpperCase(),
      completed: newStatus,
      date: todayStr,
      timestamp: new Date().toISOString(),
      markedBy: session?.role === 'teacher' ? 'teacher' : 'student',
      actorName: session?.role === 'teacher' ? session.teacherName : sName,
      category: studentCategory,
    };
    dbData.completionHistory.unshift(compHistoryItem);

    saveDatabase(dbData);

    res.json({
      success: true,
      rollNo: parseInt(rollStr, 10),
      subject,
      completed: newStatus,
      completions: dbData.completions[rollStr],
      historyItem: compHistoryItem,
    });
  });

  // 9b. Reset all HW completions for a student (Teacher)
  app.post('/api/completion/reset-student', (req: Request, res: Response) => {
    const session = getSession(req);
    if (!session || session.role !== 'teacher') {
      res.status(403).json({ error: 'Unauthorized: Teacher access required.' });
      return;
    }

    const { rollNo } = req.body;
    if (!rollNo) {
      res.status(400).json({ error: 'rollNo is required.' });
      return;
    }

    const rollStr = rollNo.toString();
    dbData.completions[rollStr] = { english: false, twau: false, maths: false, hindi: false };
    saveDatabase(dbData);

    res.json({
      success: true,
      rollNo: parseInt(rollStr, 10),
      completions: dbData.completions[rollStr],
      message: `All homework completions cleared for Roll No. ${rollStr}.`,
    });
  });

  // 9c. Get Completion History (By rollNo, subject, date, category - sorted latest to oldest, no Sundays/2nd Saturdays)
  app.get('/api/completion/history', (req: Request, res: Response) => {
    const session = getSession(req);
    const { rollNo, subject, date, category } = req.query;
    let list = dbData.completionHistory || [];

    // Filter out Sundays and 2nd Saturdays
    list = list.filter((c) => !isSundayOrSecondSaturday(c.date));

    // Security: if logged in as student, restrict to own rollNo
    if (session && session.role === 'student') {
      list = list.filter((c) => c.rollNo === session.rollNo);
    } else if (rollNo && typeof rollNo === 'string' && rollNo !== 'all') {
      list = list.filter((c) => c.rollNo === parseInt(rollNo, 10));
    }

    if (subject && typeof subject === 'string' && subject !== 'all') {
      list = list.filter((c) => c.subject === subject);
    }
    if (date && typeof date === 'string' && date !== 'all') {
      list = list.filter((c) => c.date === date);
    }
    if (category && typeof category === 'string' && category !== 'all') {
      list = list.filter((c) => {
        const cat = c.category || dbData.studentCategories?.[c.rollNo.toString()] || 'progressive';
        return cat === category;
      });
    }

    // Sort latest to oldest
    list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    res.json({
      success: true,
      history: list,
    });
  });

  // 10. Get All Students' Completion (For Teacher dashboard)
  app.get('/api/completion/all', (req: Request, res: Response) => {
    const session = getSession(req);
    if (!session || session.role !== 'teacher') {
      res.status(403).json({ error: 'Unauthorized: Teacher access required.' });
      return;
    }

    const matrix = STUDENTS.map((student) => {
      const studentStatus = dbData.completions[student.rollNo.toString()] || {
        english: false,
        twau: false,
        maths: false,
        hindi: false,
      };
      const cat = dbData.studentCategories?.[student.rollNo.toString()] || DEFAULT_SERVER_STUDENT_CATEGORIES[student.rollNo.toString()] || 'progressive';
      return {
        rollNo: student.rollNo,
        name: student.name,
        dob: student.dob,
        category: cat,
        avatar: dbData.avatars?.students?.[student.rollNo.toString()] || '',
        english: !!studentStatus.english,
        twau: !!studentStatus.twau,
        maths: !!studentStatus.maths,
        hindi: !!studentStatus.hindi,
      };
    });

    res.json({
      totalStudents: STUDENTS.length,
      matrix,
    });
  });

  // 11. Doubts / Chat API
  app.get('/api/doubts', (req: Request, res: Response) => {
    const session = getSession(req);
    const queryRollNo = req.query.rollNo ? parseInt(req.query.rollNo as string, 10) : null;
    const querySubject = (req.query.subject as string) || null;

    if (!session) {
      res.status(401).json({ error: 'Authentication required to view doubts.' });
      return;
    }

    if (session.role === 'student') {
      // Students only see their own doubts (optionally filtered by subject)
      let studentDoubts = dbData.doubts.filter((d) => d.rollNo === session.rollNo);
      if (querySubject && querySubject !== 'all') {
        studentDoubts = studentDoubts.filter((d) => d.subject === querySubject);
      }
      res.json({ messages: studentDoubts });
      return;
    }

    if (session.role === 'teacher') {
      // STRICT REQUIREMENT: Only the teacher to whom the doubt was sent can see it
      const teacherSubject = session.subject;
      if (!teacherSubject) {
        res.status(400).json({ error: 'Teacher subject not assigned.' });
        return;
      }

      // Filter doubts to ONLY those sent for THIS teacher's subject
      const teacherDoubts = dbData.doubts.filter((d) => d.subject === teacherSubject);

      if (queryRollNo) {
        // Teacher viewing a specific student's chat in THIS teacher's subject only
        const studentDoubts = teacherDoubts.filter((d) => d.rollNo === queryRollNo);
        res.json({ messages: studentDoubts });
        return;
      }

      // Teacher viewing summary of student threads & unread counts for THIS teacher's subject
      const threadMap: Record<number, { studentName: string; unreadCount: number; lastMessage: string; lastTimestamp: string; totalMessages: number }> = {};

      teacherDoubts.forEach((d) => {
        if (!threadMap[d.rollNo]) {
          threadMap[d.rollNo] = {
            studentName: d.studentName,
            unreadCount: 0,
            lastMessage: d.message,
            lastTimestamp: d.timestamp,
            totalMessages: 0,
          };
        }

        threadMap[d.rollNo].totalMessages += 1;
        if (!d.readByTeacher && d.senderRole === 'student') {
          threadMap[d.rollNo].unreadCount += 1;
        }
        if (new Date(d.timestamp) >= new Date(threadMap[d.rollNo].lastTimestamp)) {
          threadMap[d.rollNo].lastMessage = d.message;
          threadMap[d.rollNo].lastTimestamp = d.timestamp;
        }
      });

      const threads = Object.entries(threadMap).map(([rollStr, data]) => ({
        rollNo: parseInt(rollStr, 10),
        ...data,
      }));

      // Total unread strictly for THIS teacher's subject
      const totalUnread = teacherDoubts.filter((d) => !d.readByTeacher && d.senderRole === 'student').length;

      res.json({
        totalUnread,
        threads,
        allMessages: teacherDoubts,
      });
      return;
    }

    res.status(403).json({ error: 'Forbidden' });
  });

  // 12. Send Doubt Message
  app.post('/api/doubts/send', (req: Request, res: Response) => {
    const session = getSession(req);
    if (!session) {
      res.status(401).json({ error: 'Authentication required to send messages.' });
      return;
    }

    const { message, subject, rollNo, fileAttachment } = req.body;
    if (!message || !message.trim()) {
      res.status(400).json({ error: 'Message cannot be empty.' });
      return;
    }

    let targetRollNo: number;
    let targetStudentName: string;
    let targetSubject: string = subject || 'english';
    let targetTeacherName: string = '';
    const senderRole = session.role;

    if (senderRole === 'student') {
      targetRollNo = session.rollNo!;
      targetStudentName = session.studentName!;
      targetSubject = subject || 'english';
      targetTeacherName = TEACHER_INFO_BY_SUBJECT[targetSubject]?.name || dbData.homework[targetSubject]?.teacherName || 'Subject Teacher';
    } else {
      // Teacher replying - strictly locked to teacher's subject
      if (!rollNo) {
        res.status(400).json({ error: 'rollNo is required for teacher reply.' });
        return;
      }
      targetRollNo = parseInt(rollNo, 10);
      const student = STUDENTS.find((s) => s.rollNo === targetRollNo);
      targetStudentName = student ? student.name : `Roll ${targetRollNo}`;
      targetSubject = session.subject || 'english';
      targetTeacherName = session.teacherName || TEACHER_INFO_BY_SUBJECT[session.subject || 'english']?.name || 'Teacher';
    }

    const newDoubt: DoubtMessageRecord = {
      id: `doubt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      rollNo: targetRollNo,
      studentName: targetStudentName,
      subject: targetSubject,
      teacherName: targetTeacherName,
      senderRole,
      message: message.trim(),
      timestamp: new Date().toISOString(),
      readByTeacher: senderRole === 'teacher',
      readByStudent: senderRole === 'student',
      fileAttachment: fileAttachment && typeof fileAttachment === 'object' ? fileAttachment : undefined,
    };

    dbData.doubts.push(newDoubt);
    saveDatabase(dbData);

    res.json({ success: true, message: newDoubt });
  });

  // 13. Mark Doubts Read
  app.post('/api/doubts/mark-read', (req: Request, res: Response) => {
    const session = getSession(req);
    if (!session) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    const { rollNo, subject } = req.body;
    if (!rollNo) {
      res.status(400).json({ error: 'rollNo is required.' });
      return;
    }

    const targetRoll = parseInt(rollNo, 10);

    if (session.role === 'teacher') {
      const teacherSubject = session.subject;
      let markedCount = 0;
      dbData.doubts.forEach((d) => {
        // Teacher only marks messages read for their own subject
        if (d.rollNo === targetRoll && d.subject === teacherSubject && !d.readByTeacher) {
          d.readByTeacher = true;
          markedCount++;
        }
      });
      if (markedCount > 0) {
        saveDatabase(dbData);
      }
      res.json({ success: true, markedCount });
      return;
    }

    if (session.role === 'student' && session.rollNo === targetRoll) {
      let markedCount = 0;
      dbData.doubts.forEach((d) => {
        const matchSubj = !subject || subject === 'all' || d.subject === subject;
        if (d.rollNo === targetRoll && matchSubj && !d.readByStudent) {
          d.readByStudent = true;
          markedCount++;
        }
      });
      if (markedCount > 0) {
        saveDatabase(dbData);
      }
      res.json({ success: true, markedCount });
      return;
    }

    res.json({ success: true });
  });

  // 14. Delete Single Doubt Message
  app.post('/api/doubts/delete-message', (req: Request, res: Response) => {
    const session = getSession(req);
    if (!session) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    const { messageId } = req.body;
    if (!messageId) {
      res.status(400).json({ error: 'messageId is required.' });
      return;
    }

    const index = dbData.doubts.findIndex((d) => d.id === messageId);
    if (index === -1) {
      res.status(404).json({ error: 'Message not found.' });
      return;
    }

    const targetMessage = dbData.doubts[index];

    // Teachers can only delete messages belonging to their subject
    if (session.role === 'teacher' && targetMessage.subject !== session.subject) {
      res.status(403).json({ error: 'Unauthorized to delete messages for another teacher.' });
      return;
    }

    // Students can only delete messages from their own thread
    if (session.role === 'student' && targetMessage.rollNo !== session.rollNo) {
      res.status(403).json({ error: 'Unauthorized to delete this message.' });
      return;
    }

    dbData.doubts.splice(index, 1);
    saveDatabase(dbData);
    res.json({ success: true, messageId });
  });

  // 15. Clear Entire Chat Thread for a Student (strictly per teacher subject)
  app.post('/api/doubts/clear-thread', (req: Request, res: Response) => {
    const session = getSession(req);
    if (!session) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    const { rollNo, subject } = req.body;
    if (!rollNo) {
      res.status(400).json({ error: 'rollNo is required.' });
      return;
    }

    const targetRoll = parseInt(rollNo, 10);

    // If teacher: ONLY clear doubts for this student in THIS teacher's subject
    if (session.role === 'teacher') {
      const teacherSubject = session.subject;
      const initialLength = dbData.doubts.length;
      dbData.doubts = dbData.doubts.filter(
        (d) => !(d.rollNo === targetRoll && d.subject === teacherSubject)
      );
      const deletedCount = initialLength - dbData.doubts.length;
      saveDatabase(dbData);
      res.json({ success: true, rollNo: targetRoll, subject: teacherSubject, deletedCount });
      return;
    }

    // Students can only clear their own thread
    if (session.role === 'student') {
      if (session.rollNo !== targetRoll) {
        res.status(403).json({ error: 'Unauthorized to clear this thread.' });
        return;
      }
      const initialLength = dbData.doubts.length;
      dbData.doubts = dbData.doubts.filter((d) => {
        if (d.rollNo !== targetRoll) return true;
        if (subject && subject !== 'all') {
          return d.subject !== subject;
        }
        return false;
      });
      const deletedCount = initialLength - dbData.doubts.length;
      saveDatabase(dbData);
      res.json({ success: true, rollNo: targetRoll, deletedCount });
      return;
    }

    res.status(403).json({ error: 'Forbidden' });
  });

  // 16. Birthdays API
  app.get('/api/birthdays/today', (req: Request, res: Response) => {
    const today = new Date();
    const todayDay = today.getDate();
    const todayMonth = today.getMonth() + 1; // 1-12

    const celebrating = STUDENTS.filter((st) => {
      const parts = st.dob.split('/');
      if (parts.length < 2) return false;
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      return day === todayDay && month === todayMonth;
    });

    res.json({
      date: today.toISOString(),
      celebratingStudents: celebrating,
    });
  });

  // 16b. Announcements API
  // Get all announcements (with unread count for students)
  app.get('/api/announcements', (req: Request, res: Response) => {
    const session = getSession(req);
    const announcements = dbData.announcements || [];
    // Sort latest first
    const sorted = [...announcements].sort(
      (a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime()
    );

    let unreadCount = 0;
    if (session && session.role === 'student' && session.rollNo) {
      unreadCount = sorted.filter(
        (a) => !(a.readBy || []).includes(session.rollNo!)
      ).length;
    }

    res.json({
      success: true,
      announcements: sorted,
      unreadCount,
    });
  });

  // Post / Paste new announcement (Teacher only)
  app.post('/api/announcements', (req: Request, res: Response) => {
    const session = getSession(req);
    if (!session || session.role !== 'teacher') {
      res.status(403).json({ error: 'Unauthorized: Only teachers can post announcements.' });
      return;
    }

    const { title, content, category, attachments } = req.body;
    if (!title || !title.trim() || !content || !content.trim()) {
      res.status(400).json({ error: 'Title and content are required.' });
      return;
    }

    const validCategories = ['general', 'exam', 'holiday', 'urgent', 'homework'];
    const chosenCat = validCategories.includes(category) ? category : 'general';

    const newAnnouncement: AnnouncementRecord = {
      id: `ann_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: title.trim(),
      content: content.trim(),
      category: chosenCat,
      postedBy: session.teacherName || 'Faculty',
      teacherSubject: session.subject || undefined,
      postedAt: new Date().toISOString(),
      attachments: Array.isArray(attachments) ? attachments : [],
      readBy: [],
    };

    if (!dbData.announcements) dbData.announcements = [];
    dbData.announcements.unshift(newAnnouncement);
    saveDatabase(dbData);

    res.json({
      success: true,
      announcement: newAnnouncement,
      message: 'Announcement posted successfully.',
    });
  });

  // Mark announcement as read by student
  app.post('/api/announcements/:id/read', (req: Request, res: Response) => {
    const session = getSession(req);
    const { id } = req.params;
    const bodyRoll = req.body.rollNo ? parseInt(req.body.rollNo, 10) : undefined;
    const rollNo = (session && session.role === 'student' && session.rollNo) || bodyRoll;

    if (!rollNo) {
      res.status(400).json({ error: 'Student rollNo is required.' });
      return;
    }

    if (!dbData.announcements) dbData.announcements = [];
    const item = dbData.announcements.find((a) => a.id === id);
    if (item) {
      if (!item.readBy) item.readBy = [];
      if (!item.readBy.includes(rollNo)) {
        item.readBy.push(rollNo);
        saveDatabase(dbData);
      }
    }

    res.json({ success: true });
  });

  // Delete announcement (Teacher only)
  app.delete('/api/announcements/:id', (req: Request, res: Response) => {
    const session = getSession(req);
    if (!session || session.role !== 'teacher') {
      res.status(403).json({ error: 'Unauthorized: Only teachers can delete announcements.' });
      return;
    }

    const { id } = req.params;
    if (!dbData.announcements) dbData.announcements = [];
    const initialLen = dbData.announcements.length;
    dbData.announcements = dbData.announcements.filter((a) => a.id !== id);
    saveDatabase(dbData);

    res.json({
      success: true,
      deleted: initialLen > dbData.announcements.length,
    });
  });

  // 17. Current session verification
  app.get('/api/auth/me', (req: Request, res: Response) => {
    const session = getSession(req);
    if (!session) {
      res.status(401).json({ authenticated: false, error: 'No active session.' });
      return;
    }

    // Refresh avatar from db in case it was updated
    let currentAvatar = '';
    if (session.role === 'student' && session.rollNo) {
      currentAvatar = dbData.avatars?.students?.[session.rollNo.toString()] || '';
    } else if (session.role === 'teacher' && session.subject) {
      currentAvatar = dbData.avatars?.teachers?.[session.subject] || '';
    }

    if (currentAvatar) {
      session.avatar = currentAvatar;
    } else if (session.avatar) {
      // Re-populate dbData if it was missing
      if (!dbData.avatars) dbData.avatars = { students: {}, teachers: {} };
      if (session.role === 'student' && session.rollNo) {
        if (!dbData.avatars.students) dbData.avatars.students = {};
        dbData.avatars.students[session.rollNo.toString()] = session.avatar;
        saveDatabase(dbData);
      } else if (session.role === 'teacher' && session.subject) {
        if (!dbData.avatars.teachers) dbData.avatars.teachers = {};
        dbData.avatars.teachers[session.subject] = session.avatar;
        saveDatabase(dbData);
      }
    }

    res.json({ authenticated: true, session });
  });

  // 18. Avatars API (Get all student and teacher avatars)
  app.get('/api/avatars', (req: Request, res: Response) => {
    res.json({
      students: dbData.avatars?.students || {},
      teachers: dbData.avatars?.teachers || {},
    });
  });

  // 18b. Universal Direct Avatar Images (Publicly accessible on any device, cached)
  app.get('/api/avatar/student/:rollNo', (req: Request, res: Response) => {
    const rollNo = req.params.rollNo;
    const filePath = path.join(AVATAR_DIR, `student_${rollNo}.jpg`);

    if (fs.existsSync(filePath)) {
      res.setHeader('Content-Type', 'image/jpeg');
      res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=60');
      res.sendFile(filePath);
      return;
    }

    // Check if student configured an avatar in dbData
    const avatarVal = dbData.avatars?.students?.[rollNo];
    if (avatarVal) {
      if (avatarVal.startsWith('data:image/')) {
        try {
          if (!fs.existsSync(AVATAR_DIR)) fs.mkdirSync(AVATAR_DIR, { recursive: true });
          const base64Data = avatarVal.replace(/^data:image\/\w+;base64,/, '');
          const buf = Buffer.from(base64Data, 'base64');
          fs.writeFileSync(filePath, buf);
          res.setHeader('Content-Type', 'image/jpeg');
          res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=60');
          res.send(buf);
          return;
        } catch (e) {
          console.error('Error recovering student avatar file:', e);
        }
      } else if (!avatarVal.startsWith('/api/')) {
        res.setHeader('Content-Type', 'image/svg+xml');
        res.setHeader('Cache-Control', 'public, max-age=3600');
        res.send(generateDefaultAvatarSvg('student', avatarVal));
        return;
      }
    }

    // Fallback default student badge SVG
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(generateDefaultAvatarSvg('student', '🎓'));
  });

  app.get('/api/avatar/teacher/:subject', (req: Request, res: Response) => {
    const subject = req.params.subject.toLowerCase();
    const filePath = path.join(AVATAR_DIR, `teacher_${subject}.jpg`);

    if (fs.existsSync(filePath)) {
      res.setHeader('Content-Type', 'image/jpeg');
      res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=60');
      res.sendFile(filePath);
      return;
    }

    const avatarVal = dbData.avatars?.teachers?.[subject];
    if (avatarVal) {
      if (avatarVal.startsWith('data:image/')) {
        try {
          if (!fs.existsSync(AVATAR_DIR)) fs.mkdirSync(AVATAR_DIR, { recursive: true });
          const base64Data = avatarVal.replace(/^data:image\/\w+;base64,/, '');
          const buf = Buffer.from(base64Data, 'base64');
          fs.writeFileSync(filePath, buf);
          res.setHeader('Content-Type', 'image/jpeg');
          res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=60');
          res.send(buf);
          return;
        } catch (e) {
          console.error('Error recovering teacher avatar file:', e);
        }
      } else if (!avatarVal.startsWith('/api/')) {
        res.setHeader('Content-Type', 'image/svg+xml');
        res.setHeader('Cache-Control', 'public, max-age=3600');
        res.send(generateDefaultAvatarSvg('teacher', avatarVal));
        return;
      }
    }

    const defaultIcon =
      subject === 'english'
        ? '🔤'
        : subject === 'hindi'
        ? 'अ'
        : subject === 'twau'
        ? '🔬'
        : subject === 'maths'
        ? '➗'
        : '👩‍🏫';

    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(generateDefaultAvatarSvg('teacher', defaultIcon));
  });

  // 19. User Avatar Update API (Change DP or reset to default)
  app.post('/api/user/avatar', (req: Request, res: Response) => {
    const session = getSession(req);
    if (!session) {
      res.status(401).json({ error: 'Authentication required to update profile picture.' });
      return;
    }

    const { avatar } = req.body;
    if (!dbData.avatars) {
      dbData.avatars = { students: {}, teachers: {} };
    }
    if (!dbData.avatars.students) dbData.avatars.students = {};
    if (!dbData.avatars.teachers) dbData.avatars.teachers = {};

    const isStudent = session.role === 'student';
    let targetKey = '';
    let filePath = '';
    let universalUrl = '';

    if (isStudent && session.rollNo) {
      targetKey = session.rollNo.toString();
      filePath = path.join(AVATAR_DIR, `student_${targetKey}.jpg`);
      universalUrl = `/api/avatar/student/${targetKey}?t=${Date.now()}`;
    } else if (!isStudent && session.subject) {
      targetKey = session.subject.toLowerCase();
      filePath = path.join(AVATAR_DIR, `teacher_${targetKey}.jpg`);
      universalUrl = `/api/avatar/teacher/${targetKey}?t=${Date.now()}`;
    } else {
      res.status(400).json({ error: 'Invalid user session for avatar update.' });
      return;
    }

    let finalSavedAvatar: string | null = null;

    if (typeof avatar === 'string' && avatar.trim().length > 0) {
      const trimmed = avatar.trim();
      if (trimmed.startsWith('data:image/')) {
        // Write binary JPEG to disk
        try {
          if (!fs.existsSync(AVATAR_DIR)) fs.mkdirSync(AVATAR_DIR, { recursive: true });
          const base64Data = trimmed.replace(/^data:image\/\w+;base64,/, '');
          const buffer = Buffer.from(base64Data, 'base64');
          fs.writeFileSync(filePath, buffer);
        } catch (err) {
          console.error('Failed to write avatar file to disk:', err);
        }
        // Save the full dataUrl into dbData so it is never lost on restart
        finalSavedAvatar = trimmed;
      } else if (trimmed.startsWith('/api/avatar/')) {
        finalSavedAvatar = universalUrl;
      } else {
        // Emoji or preset badge
        if (fs.existsSync(filePath)) {
          try { fs.unlinkSync(filePath); } catch (e) {}
        }
        finalSavedAvatar = trimmed;
      }
    } else {
      // Reset to default
      if (fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); } catch (e) {}
      }
      finalSavedAvatar = null;
    }

    if (isStudent) {
      if (finalSavedAvatar) {
        dbData.avatars.students[targetKey] = finalSavedAvatar;
      } else {
        delete dbData.avatars.students[targetKey];
      }
    } else {
      if (finalSavedAvatar) {
        dbData.avatars.teachers[targetKey] = finalSavedAvatar;
      } else {
        delete dbData.avatars.teachers[targetKey];
      }
    }

    session.avatar = finalSavedAvatar || '';
    if (dbData.sessions && session.token && dbData.sessions[session.token]) {
      dbData.sessions[session.token].avatar = session.avatar;
    }

    saveDatabase(dbData);

    res.json({
      success: true,
      avatar: finalSavedAvatar,
      message: finalSavedAvatar
        ? 'Profile picture updated successfully!'
        : isStudent
        ? 'Reset to default student icon (🎓)'
        : 'Reset to default teacher icon (👩‍🏫)',
    });
  });

  // Explicit JSON 404 handler for any unmatched /api routes (prevents HTML fallback)
  app.all('/api/*', (req: Request, res: Response) => {
    res.status(404).json({ error: `API route ${req.method} ${req.path} not found.` });
  });

  // === VITE / STATIC SERVING ===
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Class 5 School App Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
