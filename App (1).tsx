/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { UserSession, SubjectKey } from './types';
import { api } from './lib/api';
import { Header } from './components/Header';
import { FirstPageHub } from './components/FirstPageHub';
import { LandingScreen } from './components/LandingScreen';
import { StudentLoginModal } from './components/StudentLoginModal';
import { TeacherLoginModal } from './components/TeacherLoginModal';
import { StudentDashboard } from './components/StudentDashboard';
import { TeacherDashboard } from './components/TeacherDashboard';
import { AnnouncementsPage } from './components/AnnouncementsPage';
import { CalendarPage } from './components/CalendarPage';
import { HomeworkHistoryPage } from './components/HomeworkHistoryPage';
import { DoubtsChatModal } from './components/DoubtsChatModal';
import { ProfileModal } from './components/ProfileModal';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import { StudentChangePasswordModal } from './components/StudentChangePasswordModal';
import { ChangeDpModal } from './components/ChangeDpModal';
import { NetworkStatusBanner } from './components/NetworkStatusBanner';

export type AppView =
  | 'first-page'
  | 'who-are-you'
  | 'student-login'
  | 'teacher-login'
  | 'dashboard'
  | 'announcements'
  | 'calendar'
  | 'history';

export default function App() {
  // Initialize session immediately from localStorage
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

  // Start on the First Page where user selects what they want to see
  const [currentView, setCurrentView] = useState<AppView>('first-page');

  // Announcements unread counter for notification badges
  const [unreadAnnouncementsCount, setUnreadAnnouncementsCount] = useState<number>(0);

  // Modals state
  const [isDoubtsOpen, setIsDoubtsOpen] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [isChangeDpOpen, setIsChangeDpOpen] = useState<boolean>(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState<boolean>(false);
  const [isStudentChangePasswordOpen, setIsStudentChangePasswordOpen] = useState<boolean>(false);
  const [activeDoubtTargetRoll, setActiveDoubtTargetRoll] = useState<number | null>(null);
  const [activeDoubtTargetName, setActiveDoubtTargetName] = useState<string | null>(null);
  const [activeDoubtSubject, setActiveDoubtSubject] = useState<SubjectKey | null>(null);

  // Load announcements count for notification badge
  const updateAnnouncementsBadge = async () => {
    try {
      const res = await api.getAnnouncements();
      if (typeof res?.unreadCount === 'number') {
        setUnreadAnnouncementsCount(res.unreadCount);
      }
    } catch (e) {}
  };

  useEffect(() => {
    updateAnnouncementsBadge();
    const interval = setInterval(updateAnnouncementsBadge, 10000);
    return () => clearInterval(interval);
  }, [session?.student?.rollNo]);

  // Check and sync saved session on mount
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

        if (!s.avatar && effectiveAvatar) {
          api.updateAvatar(effectiveAvatar).catch(() => {});
        }
      } else if (parsedLocalSession) {
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
          }
        }).catch((err) => {
          console.warn('Auto-restore session failed:', err);
        });
      }
    }).catch(() => {});
  }, []);

  // When user clicks Homework from First Page or Header:
  // - If session exists, open Dashboard directly without asking!
  // - If not logged in, ask "Who are you?" (Student or Teacher)
  const handleSelectHomework = () => {
    if (session) {
      setCurrentView('dashboard');
    } else {
      setCurrentView('who-are-you');
    }
  };

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
    // Directly navigate to Homework Dashboard upon login
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
    api.logout().catch(() => {});
    localStorage.removeItem('class5_session');
    localStorage.removeItem('class5_token');
    localStorage.removeItem('class5_my_avatar');
    setSession(null);
    setIsProfileOpen(false);
    // Return to First Page after logout
    setCurrentView('first-page');
  };

  const handleOpenTeacherDoubtChat = (rollNo: number, studentName?: string) => {
    setActiveDoubtTargetRoll(rollNo);
    setActiveDoubtTargetName(studentName || null);
    setIsDoubtsOpen(true);
  };

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col bg-slate-100 text-slate-900 select-none">
      {/* Network Disconnection Status Indicator */}
      <NetworkStatusBanner />

      {/* Persistent Global Header */}
      <Header
        session={session}
        currentView={currentView}
        onOpenProfile={() => setIsProfileOpen(true)}
        onLogout={handleLogout}
        onNavigateToHub={() => setCurrentView('first-page')}
        onNavigateToHomework={handleSelectHomework}
        onNavigateToAnnouncements={() => setCurrentView('announcements')}
        onNavigateToCalendar={() => setCurrentView('calendar')}
        onNavigateToHistory={() => setCurrentView('history')}
        unreadAnnouncementsCount={unreadAnnouncementsCount}
      />

      {/* Main View Area */}
      <main className="flex-1 flex flex-col items-center justify-start w-full">
        <AnimatePresence mode="wait">
          {/* VIEW 1: FIRST PAGE (Selection Hub) */}
          {currentView === 'first-page' && (
            <motion.div
              key="first-page"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="w-full flex-1"
            >
              <FirstPageHub
                session={session}
                onSelectHomework={handleSelectHomework}
                onSelectAnnouncements={() => setCurrentView('announcements')}
                onSelectCalendar={() => setCurrentView('calendar')}
                onSelectHistory={() => setCurrentView('history')}
                onOpenProfile={() => setIsProfileOpen(true)}
                onLogout={handleLogout}
                onOpenChangePassword={() => setIsChangePasswordOpen(true)}
                onOpenStudentChangePassword={() => setIsStudentChangePasswordOpen(true)}
                unreadAnnouncementsCount={unreadAnnouncementsCount}
              />
            </motion.div>
          )}

          {/* VIEW 2: "WHO ARE YOU?" (When not logged in and clicks Homework) */}
          {currentView === 'who-are-you' && (
            <motion.div
              key="who-are-you"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="w-full flex-1 flex items-center justify-center py-6"
            >
              <LandingScreen
                onBack={() => setCurrentView('first-page')}
                onSelectStudent={() => setCurrentView('student-login')}
                onSelectTeacher={() => setCurrentView('teacher-login')}
                onOpenChangePassword={() => setIsChangePasswordOpen(true)}
                onOpenStudentChangePassword={() => setIsStudentChangePasswordOpen(true)}
              />
            </motion.div>
          )}

          {/* VIEW 3: Student Login */}
          {currentView === 'student-login' && (
            <motion.div
              key="student-login"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="w-full flex-1 flex items-center justify-center py-6"
            >
              <StudentLoginModal
                onBack={() => setCurrentView('who-are-you')}
                onSuccess={handleLoginSuccess}
                onOpenChangePassword={() => setIsStudentChangePasswordOpen(true)}
              />
            </motion.div>
          )}

          {/* VIEW 4: Teacher Login */}
          {currentView === 'teacher-login' && (
            <motion.div
              key="teacher-login"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="w-full flex-1 flex items-center justify-center py-6"
            >
              <TeacherLoginModal
                onBack={() => setCurrentView('who-are-you')}
                onSuccess={handleLoginSuccess}
                onChangePassword={() => setIsChangePasswordOpen(true)}
              />
            </motion.div>
          )}

          {/* VIEW 5: Authenticated Homework Dashboard (Student or Teacher) */}
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
                  onOpenDoubts={(subj?: SubjectKey) => {
                    setActiveDoubtTargetRoll(session.student?.rollNo || null);
                    setActiveDoubtSubject(subj || null);
                    setIsDoubtsOpen(true);
                  }}
                  onOpenProfile={() => setIsProfileOpen(true)}
                  onOpenChangeDp={() => setIsChangeDpOpen(true)}
                  onOpenHistory={() => setCurrentView('history')}
                  onOpenAnnouncements={() => setCurrentView('announcements')}
                  onOpenCalendar={() => setCurrentView('calendar')}
                  onBackToHub={() => setCurrentView('first-page')}
                />
              ) : session.role === 'teacher' && session.teacher ? (
                <TeacherDashboard
                  teacher={session.teacher}
                  onOpenDoubtsForStudent={handleOpenTeacherDoubtChat}
                  onOpenProfile={() => setIsProfileOpen(true)}
                  onOpenChangeDp={() => setIsChangeDpOpen(true)}
                  onOpenHistory={() => setCurrentView('history')}
                  onOpenAnnouncements={() => setCurrentView('announcements')}
                  onOpenCalendar={() => setCurrentView('calendar')}
                  onBackToHub={() => setCurrentView('first-page')}
                />
              ) : (
                <div className="text-center py-12">
                  <p className="text-sm text-slate-500">Session expired. Please log in again.</p>
                  <button
                    onClick={() => setCurrentView('who-are-you')}
                    className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
                  >
                    Login to Homework
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* VIEW 6: Announcements Notice Board */}
          {currentView === 'announcements' && (
            <motion.div
              key="announcements"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="w-full flex-1"
            >
              <AnnouncementsPage
                session={session}
                onBack={() => setCurrentView(session ? 'dashboard' : 'first-page')}
                onNavigateToHomework={handleSelectHomework}
                onNavigateToCalendar={() => setCurrentView('calendar')}
              />
            </motion.div>
          )}

          {/* VIEW 7: School Holiday Calendar */}
          {currentView === 'calendar' && (
            <motion.div
              key="calendar"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="w-full flex-1"
            >
              <CalendarPage
                onBack={() => setCurrentView(session ? 'dashboard' : 'first-page')}
                onNavigateToHomework={handleSelectHomework}
                onNavigateToAnnouncements={() => setCurrentView('announcements')}
              />
            </motion.div>
          )}

          {/* VIEW 8: Complete Homework History in New Page */}
          {currentView === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="w-full flex-1"
            >
              <HomeworkHistoryPage
                session={session}
                onBack={() => setCurrentView(session ? 'dashboard' : 'first-page')}
                onNavigateToHub={() => setCurrentView('first-page')}
                onNavigateToAnnouncements={() => setCurrentView('announcements')}
                onNavigateToCalendar={() => setCurrentView('calendar')}
              />
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
            initialSubject={activeDoubtSubject || (session.teacher?.subject as SubjectKey) || undefined}
            onClose={() => {
              setIsDoubtsOpen(false);
              setActiveDoubtTargetRoll(null);
              setActiveDoubtTargetName(null);
              setActiveDoubtSubject(null);
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
      <footer className="w-full text-center py-3 text-[11px] text-slate-600 border-t border-slate-200/70 bg-white/50 pb-[max(env(safe-area-inset-bottom,0px),12px)]">
        <div>PM SHRI Kendriya Vidyalaya Mandla • Class 5 Portal • Session 2025–2026</div>
        <div className="text-[9px] text-slate-400 mt-0.5">Created by Pukar Kori</div>
      </footer>
    </div>
  );
}
