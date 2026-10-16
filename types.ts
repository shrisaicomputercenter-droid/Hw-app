export type SubjectKey = 'english' | 'twau' | 'maths' | 'hindi';

export type StudentCategory = 'beginner' | 'progressive' | 'proficient';

export interface CategoryInfo {
  key: StudentCategory;
  name: string;
  label: string;
  badgeColor: string;
  description: string;
}

export interface SubjectInfo {
  key: SubjectKey;
  name: string;
  flag: string;
  teacherName: string;
  iconName: string;
  color: string;
}

export interface Student {
  rollNo: number; // 501 - 541
  name: string;
  dob: string; // DD/MM/YYYY
  class: number; // 5
  avatar?: string; // Custom image data URL or emoji/icon
  category?: StudentCategory;
}

export interface StudentPasswordInfo {
  rollNo: number;
  name: string;
  dob: string;
  class: number;
  password: string;
  isDefault: boolean;
  avatar?: string;
}

export interface Teacher {
  id: string;
  name: string;
  subject: SubjectKey;
  role: 'teacher';
  avatar?: string; // Custom image data URL or emoji/icon
}

export interface UserSession {
  role: 'student' | 'teacher';
  token: string;
  student?: Student;
  teacher?: Teacher;
  avatar?: string;
}

export interface AvatarsMap {
  students: Record<string, string>;
  teachers: Record<string, string>;
}

export interface PdfDocument {
  id: string;
  fileName: string;
  title: string;
  fileType?: 'pdf' | 'image' | 'file';
  mimeType?: string;
  thumbnailUrl?: string;
  subject: SubjectKey;
  subjectName: string;
  teacherName: string;
  fileSize: number; // in bytes
  fileSizeBytes: string; // e.g. "245 KB"
  uploadedAt: string;
  homeworkSubject?: SubjectKey;
  downloadUrl?: string;
  viewUrl?: string;
  dataUrl?: string;
}

export interface HomeworkItem {
  subject: SubjectKey;
  subjectName: string;
  teacherName: string;
  content: string;
  updatedAt: string;
  assignedDate: string;
  attachments?: PdfDocument[];
  category?: 'all' | StudentCategory;
}

export type HomeworkMap = Record<SubjectKey, HomeworkItem>;

export interface StudentCompletion {
  rollNo: number;
  english: boolean;
  twau: boolean;
  maths: boolean;
  hindi: boolean;
  lastUpdated?: string;
}

export type CompletionMap = Record<number, StudentCompletion>;

export interface DoubtMessage {
  id: string;
  rollNo: number;
  studentName: string;
  subject: SubjectKey;
  teacherName: string;
  senderRole: 'student' | 'teacher';
  message: string;
  timestamp: string;
  readByTeacher: boolean;
  readByStudent: boolean;
  fileAttachment?: PdfDocument;
}

export interface DoubtThread {
  rollNo: number;
  studentName: string;
  subject: SubjectKey;
  lastMessage: string;
  lastTimestamp: string;
  unreadCount: number;
  messages: DoubtMessage[];
}

export interface LockStatus {
  isLocked: boolean;
  remainingSeconds: number;
  attemptsLeft: number;
  lockedUntil?: number;
}

export interface HomeworkHistoryItem {
  id: string;
  subject: SubjectKey;
  subjectName: string;
  teacherName: string;
  content: string;
  assignedDate: string; // e.g. "29 Sep 2026"
  createdAt: string; // ISO string
  attachments?: PdfDocument[];
  category?: 'all' | StudentCategory;
  completionStats?: {
    totalStudents: number;
    doneStudents: number;
  };
}

export interface CompletionHistoryItem {
  id: string;
  rollNo: number;
  studentName: string;
  subject: SubjectKey;
  subjectName: string;
  completed: boolean;
  date: string; // e.g. "29 Sep 2026"
  timestamp: string; // ISO string
  markedBy: 'student' | 'teacher';
  actorName?: string;
  category?: StudentCategory;
}
