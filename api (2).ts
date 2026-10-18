import {
  DoubtMessage,
  DoubtThread,
  HomeworkMap,
  LockStatus,
  PdfDocument,
  Student,
  Teacher,
  StudentPasswordInfo,
  HomeworkHistoryItem,
  CompletionHistoryItem,
  StudentCategory,
  SubjectKey,
  HomeworkItem,
  SchoolAnnouncement,
} from '../types';
import { networkStatusTracker } from './networkStatus';

const API_BASE = '/api';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('class5_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function safeRequest<T>(url: string, options?: RequestInit): Promise<T> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    networkStatusTracker.reportNetworkFailure(
      "Oops! You are offline. Could not catch the network."
    );
    return {
      error: "Oops! Could not catch network. Please check your internet connection and try again.",
    } as unknown as T;
  }

  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type') || '';
    const text = await res.text();

    if (res.ok) {
      networkStatusTracker.reportNetworkSuccess();
    }

    if (contentType.includes('application/json') || text.trim().startsWith('{') || text.trim().startsWith('[')) {
      try {
        return JSON.parse(text) as T;
      } catch (e) {
        console.warn(`[API] JSON parse failed for ${url}:`, e);
      }
    }

    if (!res.ok) {
      console.warn(`[API] HTTP error ${res.status} for ${url}`);
      return { error: `Server error (${res.status})` } as unknown as T;
    }

    return {} as T;
  } catch (err: any) {
    console.warn(`[API] Network failure for ${url}:`, err);
    networkStatusTracker.reportNetworkFailure(
      "Oops! Could not catch network. Please check your internet connection."
    );
    return {
      error: "Oops! Could not catch network. Please check your internet connection and try again.",
    } as unknown as T;
  }
}

export const api = {
  // Check active session
  async checkSession(): Promise<{ authenticated: boolean; session?: any; error?: string }> {
    return safeRequest(`${API_BASE}/auth/me`, {
      headers: getAuthHeader(),
    });
  },

  // Logout active session
  async logout(): Promise<{ success: boolean }> {
    return safeRequest(`${API_BASE}/auth/logout`, {
      method: 'POST',
      headers: getAuthHeader(),
    });
  },

  // Restore session without password prompt (auto-reconnects returning students & teachers)
  async restoreSession(params: {
    role: 'student' | 'teacher';
    rollNo?: number;
    subject?: string;
    token?: string;
    avatar?: string;
  }): Promise<{
    success: boolean;
    token?: string;
    session?: any;
    student?: Student;
    teacher?: Teacher;
    error?: string;
  }> {
    return safeRequest(`${API_BASE}/auth/restore-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
  },

  // Lock Status
  async getLockStatus(role: 'student' | 'teacher'): Promise<LockStatus> {
    const data = await safeRequest<LockStatus>(`${API_BASE}/auth/lock-status?role=${role}`);
    return data || { isLocked: false, remainingSeconds: 0, attemptsLeft: 3 };
  },

  // Student Login (Password based - replaced roll no.)
  async studentLogin(password: string | number): Promise<{
    success: boolean;
    token?: string;
    student?: Student;
    error?: string;
    lockStatus?: LockStatus;
  }> {
    return safeRequest(`${API_BASE}/auth/student-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: String(password).trim() }),
    });
  },

  // Change Student Password
  async changeStudentPassword(params: {
    rollNo?: number;
    currentPassword: string;
    newPassword: string;
  }): Promise<{
    success: boolean;
    message?: string;
    student?: Student;
    error?: string;
    lockStatus?: LockStatus;
  }> {
    return safeRequest(`${API_BASE}/auth/student-change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
  },

  // Teacher Login
  async teacherLogin(password: string): Promise<{
    success: boolean;
    token?: string;
    teacher?: Teacher;
    error?: string;
    lockStatus?: LockStatus;
  }> {
    return safeRequest(`${API_BASE}/auth/teacher-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
  },

  // Change Teacher Password
  async changeTeacherPassword(subject: string, oldPassword: string, newPassword: string): Promise<{
    success: boolean;
    message?: string;
    subject?: string;
    error?: string;
    lockStatus?: LockStatus;
  }> {
    return safeRequest(`${API_BASE}/auth/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject, oldPassword, newPassword }),
    });
  },

  // Smriti Ma'am Only: Get Class 5 Student Passwords Directory
  async getClassPasswords(): Promise<{
    success: boolean;
    students?: StudentPasswordInfo[];
    authorizedTeacher?: string;
    error?: string;
  }> {
    return safeRequest(`${API_BASE}/teacher/class-passwords`, {
      headers: getAuthHeader(),
    });
  },

  // Smriti Ma'am Only: Reset Student Password
  async resetStudentPassword(rollNo: number, newPassword?: string): Promise<{
    success: boolean;
    message?: string;
    student?: { rollNo: number; name: string; password: string };
    error?: string;
  }> {
    return safeRequest(`${API_BASE}/teacher/reset-student-password`, {
      method: 'POST',
      headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ rollNo, newPassword }),
    });
  },

  // Get all student categories
  async getStudentCategories(): Promise<{
    success: boolean;
    categories: Record<number, StudentCategory>;
  }> {
    const data = await safeRequest<{ success: boolean; categories: Record<number, StudentCategory> }>(
      `${API_BASE}/student-categories`
    );
    return {
      success: data?.success ?? true,
      categories: data?.categories || {},
    };
  },

  // Update a single student's category (Teacher only)
  async updateStudentCategory(
    rollNo: number,
    category: StudentCategory
  ): Promise<{ success: boolean; categories?: Record<number, StudentCategory>; error?: string }> {
    return safeRequest(`${API_BASE}/student-categories/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({ rollNo, category }),
    });
  },

  // Bulk update student categories (Teacher only)
  async bulkUpdateStudentCategories(
    updates: Array<{ rollNo: number; category: StudentCategory }>
  ): Promise<{ success: boolean; categories?: Record<number, StudentCategory>; error?: string }> {
    return safeRequest(`${API_BASE}/student-categories/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({ updates }),
    });
  },

  // Get Category Homework map
  async getCategoryHomework(): Promise<{
    success: boolean;
    categoryHomework: Record<SubjectKey, Partial<Record<StudentCategory | 'all', HomeworkItem>>>;
  }> {
    const data = await safeRequest<any>(`${API_BASE}/homework/categories`);
    return {
      success: data?.success ?? true,
      categoryHomework: data?.categoryHomework || {},
    };
  },

  // Get Homework (optionally filtered by rollNo or category)
  async getHomework(params?: { rollNo?: number; category?: string }): Promise<HomeworkMap> {
    const q = new URLSearchParams();
    if (params?.rollNo) q.set('rollNo', params.rollNo.toString());
    if (params?.category) q.set('category', params.category);
    const qs = q.toString() ? `?${q.toString()}` : '';
    const data = await safeRequest<HomeworkMap>(`${API_BASE}/homework${qs}`, {
      headers: getAuthHeader(),
    });
    return (data && data.english) ? data : ({} as HomeworkMap);
  },

  // Update Homework (Teacher) - supports category and assignedDate
  async updateHomework(
    subject: string,
    content: string,
    attachments?: PdfDocument[],
    category?: 'all' | StudentCategory,
    assignedDate?: string
  ): Promise<{ success: boolean; homework?: any; categoryHomework?: any; historyItem?: any; error?: string }> {
    return safeRequest(`${API_BASE}/homework`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({ subject, content, attachments, category, assignedDate }),
    });
  },

  // Get PDF Worksheets
  async getPdfFiles(subject?: string): Promise<{ files: PdfDocument[] }> {
    const url = subject && subject !== 'all' ? `${API_BASE}/files/pdf?subject=${subject}` : `${API_BASE}/files/pdf`;
    const data = await safeRequest<{ files: PdfDocument[] }>(url, {
      headers: getAuthHeader(),
    });
    return data && Array.isArray(data.files) ? data : { files: [] };
  },

  // Upload File or Image Worksheet (Teacher)
  async uploadFile(payload: {
    fileName: string;
    title: string;
    subject: string;
    dataUrl: string;
    attachToHomework?: boolean;
    fileType?: 'pdf' | 'image' | 'file';
  }): Promise<{ success: boolean; file?: PdfDocument; message?: string; error?: string }> {
    return safeRequest(`${API_BASE}/files/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(payload),
    });
  },

  // Upload PDF Worksheet (Teacher - alias for uploadFile)
  async uploadPdf(payload: {
    fileName: string;
    title: string;
    subject: string;
    dataUrl: string;
    attachToHomework?: boolean;
  }): Promise<{ success: boolean; file?: PdfDocument; message?: string; error?: string }> {
    return this.uploadFile(payload);
  },

  // Delete PDF Worksheet (Teacher)
  async deletePdf(id: string): Promise<{ success: boolean; id?: string; error?: string }> {
    return safeRequest(`${API_BASE}/files/delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({ id }),
    });
  },

  // Helper to trigger browser download of a PDF
  downloadPdf(downloadUrl: string, fileName?: string): void {
    const a = document.createElement('a');
    a.href = downloadUrl;
    if (fileName) {
      a.download = fileName;
    }
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  },

  // Get Student Completion
  async getStudentCompletion(rollNo: number): Promise<{
    rollNo: number;
    english: boolean;
    twau: boolean;
    maths: boolean;
    hindi: boolean;
  }> {
    const data = await safeRequest<any>(`${API_BASE}/completion/student/${rollNo}`, {
      headers: getAuthHeader(),
    });
    return data || { rollNo, english: false, twau: false, maths: false, hindi: false };
  },

  // Toggle Completion
  async toggleCompletion(rollNo: number, subject: string, completed?: boolean): Promise<any> {
    return safeRequest(`${API_BASE}/completion/toggle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({ rollNo, subject, completed }),
    });
  },

  // Reset all completions for a student (Teacher)
  async resetStudentCompletions(rollNo: number): Promise<{ success: boolean; rollNo?: number; message?: string; error?: string }> {
    return safeRequest(`${API_BASE}/completion/reset-student`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({ rollNo }),
    });
  },

  // Get All Completions (Teacher)
  async getAllCompletions(): Promise<{
    totalStudents: number;
    matrix: Array<{
      rollNo: number;
      name: string;
      dob: string;
      english: boolean;
      twau: boolean;
      maths: boolean;
      hindi: boolean;
    }>;
  }> {
    const data = await safeRequest<any>(`${API_BASE}/completion/all`, {
      headers: getAuthHeader(),
    });
    return data || { totalStudents: 0, matrix: [] };
  },

  // Get Doubts (optionally filtered by student rollNo and/or subject)
  async getDoubts(
    rollNo?: number,
    subject?: string
  ): Promise<{
    messages?: DoubtMessage[];
    threads?: DoubtThread[];
    totalUnread?: number;
    allMessages?: DoubtMessage[];
  }> {
    const q = new URLSearchParams();
    if (rollNo) q.set('rollNo', rollNo.toString());
    if (subject) q.set('subject', subject);
    const qs = q.toString() ? `?${q.toString()}` : '';
    const url = `${API_BASE}/doubts${qs}`;
    const data = await safeRequest<any>(url, {
      headers: getAuthHeader(),
    });
    return data || { messages: [], threads: [], totalUnread: 0, allMessages: [] };
  },

  // Send Doubt Message
  async sendDoubt(
    message: string,
    subject?: string,
    rollNo?: number,
    fileAttachment?: PdfDocument
  ): Promise<{ success: boolean; message?: DoubtMessage; error?: string }> {
    return safeRequest(`${API_BASE}/doubts/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({ message, subject, rollNo, fileAttachment }),
    });
  },

  // Mark Doubts Read
  async markDoubtsRead(rollNo: number, subject?: string): Promise<{ success: boolean; markedCount?: number }> {
    return safeRequest(`${API_BASE}/doubts/mark-read`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({ rollNo, subject }),
    });
  },

  // Delete Single Doubt Message
  async deleteDoubtMessage(messageId: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    return safeRequest(`${API_BASE}/doubts/delete-message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({ messageId }),
    });
  },

  // Clear Entire Chat Thread for Student (optionally for specific teacher subject)
  async clearDoubtThread(rollNo: number, subject?: string): Promise<{ success: boolean; rollNo?: number; deletedCount?: number; error?: string }> {
    return safeRequest(`${API_BASE}/doubts/clear-thread`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({ rollNo, subject }),
    });
  },

  // Get Birthdays Today
  async getBirthdaysToday(): Promise<{
    date: string;
    celebratingStudents: Student[];
  }> {
    const data = await safeRequest<any>(`${API_BASE}/birthdays/today`);
    return data || { date: new Date().toISOString(), celebratingStudents: [] };
  },

  // Update Display Picture (DP) / Avatar
  async updateAvatar(avatar: string | null): Promise<{
    success: boolean;
    avatar?: string | null;
    message?: string;
    error?: string;
  }> {
    return safeRequest(`${API_BASE}/user/avatar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({ avatar }),
    });
  },

  // Get all avatars for students and teachers
  async getAllAvatars(): Promise<{
    students: Record<string, string>;
    teachers: Record<string, string>;
  }> {
    const data = await safeRequest<any>(`${API_BASE}/avatars`);
    return {
      students: data?.students || {},
      teachers: data?.teachers || {},
    };
  },

  // Homework History (Sent on which date)
  async getHomeworkHistory(params?: { subject?: string; date?: string; category?: string }): Promise<{
    success: boolean;
    history: HomeworkHistoryItem[];
    error?: string;
  }> {
    const q = new URLSearchParams();
    if (params?.subject) q.set('subject', params.subject);
    if (params?.date) q.set('date', params.date);
    if (params?.category) q.set('category', params.category);
    const qs = q.toString() ? `?${q.toString()}` : '';
    const res = await safeRequest<any>(`${API_BASE}/homework/history${qs}`, {
      headers: getAuthHeader(),
    });
    return {
      success: res?.success ?? true,
      history: Array.isArray(res?.history) ? res.history : [],
      error: res?.error,
    };
  },

  // Delete Homework History Record (Teacher only)
  async deleteHomeworkHistory(id: string): Promise<{ success: boolean; message?: string; error?: string }> {
    return safeRequest(`${API_BASE}/homework/history/${id}`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    });
  },

  // Completion History (Who completed on which date)
  async getCompletionHistory(params?: { rollNo?: number; subject?: string; date?: string; category?: string }): Promise<{
    success: boolean;
    history: CompletionHistoryItem[];
    error?: string;
  }> {
    const q = new URLSearchParams();
    if (params?.rollNo) q.set('rollNo', params.rollNo.toString());
    if (params?.subject) q.set('subject', params.subject);
    if (params?.date) q.set('date', params.date);
    if (params?.category) q.set('category', params.category);
    const qs = q.toString() ? `?${q.toString()}` : '';
    const res = await safeRequest<any>(`${API_BASE}/completion/history${qs}`, {
      headers: getAuthHeader(),
    });
    return {
      success: res?.success ?? true,
      history: Array.isArray(res?.history) ? res.history : [],
      error: res?.error,
    };
  },

  // Announcements API
  async getAnnouncements(): Promise<{
    success: boolean;
    announcements: SchoolAnnouncement[];
    unreadCount: number;
    error?: string;
  }> {
    const res = await safeRequest<any>(`${API_BASE}/announcements`, {
      headers: getAuthHeader(),
    });
    return {
      success: res?.success ?? true,
      announcements: Array.isArray(res?.announcements) ? res.announcements : [],
      unreadCount: typeof res?.unreadCount === 'number' ? res.unreadCount : 0,
      error: res?.error,
    };
  },

  async createAnnouncement(data: {
    title: string;
    content: string;
    category?: 'general' | 'exam' | 'holiday' | 'urgent' | 'homework';
    attachments?: PdfDocument[];
  }): Promise<{
    success: boolean;
    announcement?: SchoolAnnouncement;
    message?: string;
    error?: string;
  }> {
    return safeRequest(`${API_BASE}/announcements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(data),
    });
  },

  async markAnnouncementRead(id: string, rollNo?: number): Promise<{ success: boolean; error?: string }> {
    return safeRequest(`${API_BASE}/announcements/${id}/read`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({ rollNo }),
    });
  },

  async deleteAnnouncement(id: string): Promise<{ success: boolean; deleted?: boolean; error?: string }> {
    return safeRequest(`${API_BASE}/announcements/${id}`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    });
  },
};
