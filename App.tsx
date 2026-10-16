/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { UserSession, PdfDocument } from './types';
import { api } from './lib/api';
import { Header } from './components/Header';
import { LandingScreen } from './components/LandingScreen';
import { StudentLoginModal } from './components/StudentLoginModal';
import { TeacherLoginModal } from './components/TeacherLoginModal';
import { StudentDashboard } from './components/StudentDashboard';
import { TeacherDashboard } from './components/TeacherDashboard';
import { HomeworkHistoryPage } from './components/HomeworkHistoryPage';
import { PdfViewerModal } from './components/PdfViewerModal';
import { DoubtsChatModal } from './components/DoubtsChatModal';
import { ProfileModal } from './components/ProfileModal';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import { StudentChangePasswordModal } from './components/StudentChangePasswordModal';
import { ChangeDpModal } from './components/ChangeDpModal';
import { NetworkStatusBanner } from './components/NetworkStatusBanner';

type AppView = 'landing' | 'student-login' | 'teacher-login' | 'dashboard' | 'history';

export default function App() {
  // Initialize session immediately from localStorage so returning users never see a password prompt
  const [session, setSession] = useState<UserSession | null>(() => {
    try {
      const saved = localStorage.getItem('class5_session');
      if (saved) {
        const parsed: UserSession = JSON.parse(saved);
        const cachedAvatar = localStorage.getItem('class5_my_avatar');
        if (cachedAvatar && !parsed.avatar) {
          parsed.avatar = cachedAvatar;
          if (parsed.student) parsed.student.avatar = cachedAvatar;
          if (parsed.teacher) parsed.teacher.avatar = cachedAvatar;
        }
        return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse saved session:', e);
    }
    return null;
  });

  const [currentView, setCurrentView] = useState<AppView>(() => {
    try {
      const saved = localStorage.getItem('class5_session');
      if (saved) return 'dashboard';
    } catch {}
    return 'landing';
  });

  // Modals state
  const [isDoubtsOpen, setIsDoubtsOpen] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [isChangeDpOpen, setIsChangeDpOpen] = useState<boolean>(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState<boolean>(false);
  const [viewingPdf, setViewingPdf] = useState<PdfDocument | null>(null);
  const [isStudentChangePasswordOpen, setIsStudentChangePasswordOpen] = useState<boolean>(false);
  const [activeDoubtTargetRoll, setActiveDoubtTargetRoll] = useState<number | null>(null);
  const [activeDoubtTargetName, setActiveDoubtTargetName] = useState<string | null>(null);

  // Check and sync saved session on mount (without forcing logout or asking password)
  useEffect(() => {
    const savedSessionRaw = localStorage.getItem('class5_session');
    const token = localStorage.getItem('class5_token');
    const localAvatar = localStorage.getItem('class5_my_avatar') || '';

    let parsedLocalSession: UserSession | null = null;
    if (savedSessionRaw) {
      try {
        parsedLocalSession = JSON.parse(savedSessionRaw);
      } catch {}
    }

    if (!token && !parsedLocalSession) return;

    // Check with backend
    api.checkSession().then((res) => {
      if (res.authenticated && res.session) {
        const s = res.session;
        // Prioritize custom avatar: server avatar, or saved local avatar
        const effectiveAvatar = s.avatar || parsedLocalSession?.avatar || localAvatar;

        const updatedSession: UserSession = s.role === 'teacher' ? {
          role: 'teacher',
          token: s.token,
          avatar: effectiveAvatar,
          teacher: {
            id: s.teacherId,
            name: s.teacherName,
            subject: s.subject,
            role: 'teacher',
            avatar: effectiveAvatar,
          },
        } : {
          role: 'student',
          token: s.token,
          avatar: effectiveAvatar,
          student: {
            rollNo: s.rollNo,
            name: s.studentName,
            dob: '',
            class: 5,
            avatar: effectiveAvatar,
          },
        };

        setSession(updatedSession);
        localStorage.setItem('class5_session', JSON.stringify(updatedSession));
        localStorage.setItem('class5_token', s.token);
        if (effectiveAvatar) {
          localStorage.setItem('class5_my_avatar', effectiveAvatar);
        }

        // Auto-heal backend if backend didn't have the user's avatar
        if (!s.avatar && effectiveAvatar) {
          api.updateAvatar(effectiveAvatar).catch(() => {});
        }

        setCurrentView('dashboard');
      } else if (parsedLocalSession) {
        // Backend restarted or token lost from RAM: seamlessly restore session without asking password!
        const restorePayload: any = {
          role: parsedLocalSession.role,
          token: parsedLocalSession.token || token || undefined,
          avatar: parsedLocalSession.avatar || localAvatar || undefined,
        };
        if (parsedLocalSession.role === 'student' && parsedLocalSession.student?.rollNo) {
          restorePayload.rollNo = parsedLocalSession.student.rollNo;
        } else if (parsedLocalSession.role === 'teacher' && parsedLocalSession.teacher?.subject) {
          restorePayload.subject = parsedLocalSession.teacher.subject;
        }

        api.restoreSession(restorePayload).then((restoreRes) => {
          if (restoreRes.success && restoreRes.session) {
            const restored = restoreRes.session;
            const effectiveAvatar = restored.avatar || parsedLocalSession?.avatar || localAvatar;
            const updatedSession: UserSession = restored.role === 'teacher' ? {
              role: 'teacher',
              token: restoreRes.token || restored.token,
              avatar: effectiveAvatar,
              teacher: {
                id: restored.teacherId,
                name: restored.teacherName,
                subject: restored.subject,
                role: 'teacher',
                avatar: effectiveAvatar,
              },
            } : {
              role: 'student',
              token: restoreRes.token || restored.token,
              avatar: effectiveAvatar,
              student: {
                rollNo: restored.rollNo,
                name: restored.studentName,
                dob: '',
                class: 5,
                avatar: effectiveAvatar,
              },
            };

            setSession(updatedSession);
            localStorage.setItem('class5_session', JSON.stringify(updatedSession));
            if (restoreRes.token) localStorage.setItem('class5_token', restoreRes.token);
            if (effectiveAvatar) localStorage.setItem('class5_my_avatar', effectiveAvatar);
            setCurrentView('dashboard');
          }
        }).catch((err) => {
          console.warn('Auto-restore session failed:', err);
        });
      }
    }).catch(() => {
      // Network glitch or offline: keep local session active!
    });
  }, []);

  const handleLoginSuccess = (newSession: UserSession) => {
    setSession(newSession);
    localStorage.setItem('class5_session', JSON.stringify(newSession));
    if (newSession.token) {
      localStorage.setItem('class5_token', newSession.token);
    }
    if (newSession.avatar) {
      localStorage.setItem('class5_my_avatar', newSession.avatar);
      if (newSession.student?.rollNo) {
        localStorage.setItem(`class5_avatar_student_${newSession.student.rollNo}`, newSession.avatar);
      } else if (newSession.teacher?.subject) {
        localStorage.setItem(`class5_avatar_teacher_${newSession.teacher.subject}`, newSession.avatar);
      }
    }
    setCurrentView('dashboard');
  };

  const handleAvatarUpdated = (newAvatar: string | null) => {
    const clean = newAvatar || '';
    setSession((prev) => {
      if (!prev) return null;
      const updated: UserSession = {
        ...prev,
        avatar: clean,
        student: prev.student ? { ...prev.student, avatar: clean } : undefined,
        teacher: prev.teacher ? { ...prev.teacher, avatar: clean } : undefined,
      };
      localStorage.setItem('class5_session', JSON.stringify(updated));
      return updated;
    });

    if (clean) {
      localStorage.setItem('class5_my_avatar', clean);
      if (session?.student?.rollNo) {
        localStorage.setItem(`class5_avatar_student_${session.student.rollNo}`, clean);
      } else if (session?.teacher?.subject) {
        localStorage.setItem(`class5_avatar_teacher_${session.teacher.subject}`, clean);
      }
    } else {
      localStorage.removeItem('class5_my_avatar');
      if (session?.student?.rollNo) {
        localStorage.removeItem(`class5_avatar_student_${session.student.rollNo}`);
      } else if (session?.teacher?.subject) {
        localStorage.removeItem(`class5_avatar_teacher_${session.teacher.subject}`);
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('class5_token');
    localStorage.removeItem('class5_session');
    localStorage.removeItem('class5_my_avatar');
    setSession(null);
    setIsProfileOpen(false);
    setIsDoubtsOpen(false);
    setActiveDoubtTargetRoll(null);
    setActiveDoubtTargetName(null);
    setCurrentView('landing');
  };

  const handleOpenTeacherDoubtChat = (rollNo: number, studentName?: string) => {
    setActiveDoubtTargetRoll(rollNo);
    setActiveDoubtTargetName(studentName || null);
    setIsDoubtsOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Network Connectivity & Offline Alert Banner */}
      <NetworkStatusBanner />

      {/* School Portal Top Header */}
      <Header
        session={session}
        onOpenProfile={() => setIsProfileOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main View Area */}
      <main className="flex-1 flex flex-col items-center justify-start w-full">
        <AnimatePresence mode="wait">
          {/* SCREEN 1: First Screen ("Who are you?") */}
          {currentView === 'landing' && (
            <motion.div
              key="landing"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="w-full flex-1 flex items-center justify-center"
            >
              <LandingScreen
                onSelectStudent={() => setCurrentView('student-login')}
                onSelectTeacher={() => setCurrentView('teacher-login')}
                onOpenChangePassword={() => setIsChangePasswordOpen(true)}
                onOpenStudentChangePassword={() => setIsStudentChangePasswordOpen(true)}
              />
            </motion.div>
          )}

          {/* SCREEN 2: Student Login */}
          {currentView === 'student-login' && (
            <motion.div
              key="student-login"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="w-full flex-1 flex items-center justify-center"
            >
              <StudentLoginModal
                onBack={() => setCurrentView('landing')}
                onSuccess={handleLoginSuccess}
                onOpenChangePassword={() => setIsStudentChangePasswordOpen(true)}
              />
            </motion.div>
          )}

          {/* SCREEN 3: Teacher Login */}
          {currentView === 'teacher-login' && (
            <motion.div
              key="teacher-login"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="w-full flex-1 flex items-center justify-center"
            >
              <TeacherLoginModal
                onBack={() => setCurrentView('landing')}
                onSuccess={handleLoginSuccess}
                onChangePassword={() => setIsChangePasswordOpen(true)}
              />
            </motion.div>
          )}

          {/* SCREEN 4: Authenticated Dashboard (Student or Teacher) */}
          {currentView === 'history' && session && (
            <motion.div
              key="history"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="w-full flex-1 py-2"
            >
              <button
                type="button"
                onClick={() => setCurrentView('dashboard')}
                className="mb-4 flex items-center gap-1.5 text-sm font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3.5 py-2 rounded-xl border border-blue-200 transition-all cursor-pointer"
              >
                ← Back to Dashboard
              </button>
              <HomeworkHistoryPage
                session={session}
                onViewPdf={(pdf) => setViewingPdf(pdf)}
                onNavigateToPasteHW={() => setCurrentView('dashboard')}
                isInlineFullPage={true}
              />
            </motion.div>
          )}

          {currentView === 'dashboard' && session && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="w-full flex-1 py-2"
            >
              {session.role === 'student' && session.student ? (
                <StudentDashboard
                  student={session.student}
                  onOpenDoubts={() => {
                    setActiveDoubtTargetRoll(session.student?.rollNo || null);
                    setIsDoubtsOpen(true);
                  }}
                  onOpenProfile={() => setIsProfileOpen(true)}
                  onOpenChangeDp={() => setIsChangeDpOpen(true)}
                  onOpenHistory={() => setCurrentView('history')}
                />
              ) : session.role === 'teacher' && session.teacher ? (
                <TeacherDashboard
                  teacher={session.teacher}
                  onOpenDoubtsForStudent={handleOpenTeacherDoubtChat}
                  onOpenProfile={() => setIsProfileOpen(true)}
                  onOpenChangeDp={() => setIsChangeDpOpen(true)}
                  onOpenHistory={() => setCurrentView('history')}
                />
              ) : (
                <div className="text-center py-12">
                  <p className="text-sm text-slate-500">Session expired. Please log in again.</p>
                  <button
                    onClick={handleLogout}
                    className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
                  >
                    Return to Login
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Private Student-Teacher Doubts Chat Modal */}
      <AnimatePresence>
        {isDoubtsOpen && session && (
          <DoubtsChatModal
            session={session}
            targetStudentRoll={activeDoubtTargetRoll}
            targetStudentName={activeDoubtTargetName}
            onClose={() => {
              setIsDoubtsOpen(false);
              setActiveDoubtTargetRoll(null);
              setActiveDoubtTargetName(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Profile & Logout Modal */}
      <AnimatePresence>
        {isProfileOpen && session && (
          <ProfileModal
            session={session}
            onClose={() => setIsProfileOpen(false)}
            onLogout={handleLogout}
            onChangePassword={() => setIsChangePasswordOpen(true)}
            onStudentChangePassword={() => setIsStudentChangePasswordOpen(true)}
            onAvatarUpdated={handleAvatarUpdated}
          />
        )}
      </AnimatePresence>

      {/* Change DP / Avatar Modal */}
      <AnimatePresence>
        {isChangeDpOpen && session && (
          <ChangeDpModal
            isOpen={isChangeDpOpen}
            session={session}
            onClose={() => setIsChangeDpOpen(false)}
            onAvatarUpdated={handleAvatarUpdated}
          />
        )}
      </AnimatePresence>

      {/* PDF Viewer Modal (used by the top-level History page) */}
      {viewingPdf && (
        <PdfViewerModal
          file={viewingPdf}
          onClose={() => setViewingPdf(null)}
        />
      )}

      {/* Change Teacher Password Modal */}
      <AnimatePresence>
        {isChangePasswordOpen && (
          <ChangePasswordModal
            isOpen={isChangePasswordOpen}
            onClose={() => setIsChangePasswordOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Change Student Password Modal */}
      <AnimatePresence>
        {isStudentChangePasswordOpen && (
          <StudentChangePasswordModal
            isOpen={isStudentChangePasswordOpen}
            onClose={() => setIsStudentChangePasswordOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Footer Branding */}
      <footer className="w-full text-center py-3 text-[11px] text-slate-600 border-t border-slate-200/70 bg-white/50">
        <div>PM SHRI Kendriya Vidyalaya Mandla • Class 5 Portal • Session 2025–2026</div>
        <div className="text-[9px] text-slate-400 mt-0.5">Created by Pukar Kori</div>
      </footer>
    </div>
  );
}
