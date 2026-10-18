import React from 'react';
import { motion } from 'motion/react';
import {
  BookOpen,
  Bell,
  Calendar,
  History,
  Key,
  GraduationCap,
  Sparkles,
  ArrowRight,
  LogOut,
  User,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sun,
  School,
} from 'lucide-react';
import { UserSession } from '../types';
import { UserAvatar } from './UserAvatar';
import { SUBJECTS_CONFIG } from '../studentData';
import { isSundayOrSecondSaturday, getTodaySchoolDate } from '../lib/dateUtils';

interface FirstPageHubProps {
  session: UserSession | null;
  onSelectHomework: () => void;
  onSelectAnnouncements: () => void;
  onSelectCalendar: () => void;
  onSelectHistory: () => void;
  onOpenProfile: () => void;
  onLogout: () => void;
  onOpenChangePassword: () => void;
  onOpenStudentChangePassword: () => void;
  unreadAnnouncementsCount?: number;
}

export const FirstPageHub: React.FC<FirstPageHubProps> = ({
  session,
  onSelectHomework,
  onSelectAnnouncements,
  onSelectCalendar,
  onSelectHistory,
  onOpenProfile,
  onLogout,
  onOpenChangePassword,
  onOpenStudentChangePassword,
  unreadAnnouncementsCount = 0,
}) => {
  const today = new Date();
  const isHolidayToday = isSundayOrSecondSaturday(today);
  const formattedTodayDate = today.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const isStudent = session?.role === 'student';
  const isTeacher = session?.role === 'teacher';

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      {/* School Hero Emblem & Title Banner */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="text-center"
      >
        <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-tr from-blue-700 via-indigo-600 to-blue-500 rounded-3xl shadow-xl shadow-blue-500/20 border-4 border-white mb-3 relative">
          <span className="text-4xl select-none animate-bounce drop-shadow-md">🏫</span>
        </div>

        <div className="inline-block bg-blue-50 text-blue-900 text-xs font-black uppercase tracking-widest px-3.5 py-1 rounded-full border border-blue-200 mb-2">
          PM SHRI KENDRIYA VIDYALAYA MANDLA
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
          PM SHRI Kendriya Vidyalaya Mandla
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1 font-semibold">
          Class 5 Student & Teacher Portal • Session 2025–2026
        </p>
      </motion.div>

      {/* Today's School Status Bar */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.05 }}
        className="bg-white rounded-2xl p-3.5 sm:px-5 shadow-md border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs"
      >
        <div className="flex items-center gap-2 text-slate-700 font-semibold">
          <Clock className="w-4 h-4 text-blue-600 shrink-0" />
          <span>{formattedTodayDate}</span>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`font-black px-3 py-1 rounded-full border text-[11px] flex items-center gap-1.5 ${
              isHolidayToday
                ? 'bg-rose-50 text-rose-800 border-rose-200'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isHolidayToday ? 'bg-rose-500' : 'bg-emerald-500 animate-pulse'}`} />
            <span>{isHolidayToday ? 'School Holiday Today' : 'School Open Today'}</span>
          </span>

          {unreadAnnouncementsCount > 0 && (
            <button
              onClick={onSelectAnnouncements}
              className="font-bold text-[11px] bg-amber-500 hover:bg-amber-600 text-white px-3 py-1 rounded-full shadow-xs flex items-center gap-1.5 animate-pulse cursor-pointer"
            >
              <Bell className="w-3 h-3" />
              <span>{unreadAnnouncementsCount} New Notice{unreadAnnouncementsCount > 1 ? 's' : ''}!</span>
            </button>
          )}
        </div>
      </motion.div>

      {/* Logged-In User Quick Status Banner (If logged in) */}
      {session && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-3xl p-4 sm:p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-blue-800"
        >
          <div className="flex items-center space-x-3.5">
            <UserAvatar
              avatar={session.avatar || (isStudent ? session.student?.avatar : session.teacher?.avatar)}
              role={session.role}
              size="md"
              defaultIcon={isTeacher && session.teacher?.subject ? SUBJECTS_CONFIG[session.teacher.subject]?.flag : undefined}
              borderClass="border-2 border-white/60 shadow-xs"
            />
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-200 bg-blue-800/80 px-2 py-0.5 rounded-full border border-blue-600/50">
                Logged In as {isStudent ? 'Student' : 'Faculty'}
              </span>
              <h2 className="text-base sm:text-lg font-black text-white mt-0.5">
                {isStudent ? session.student?.name : session.teacher?.name}
              </h2>
              <p className="text-xs text-blue-100/80 font-medium">
                {isStudent ? `Class 5 • Roll No. ${session.student?.rollNo}` : `${SUBJECTS_CONFIG[session.teacher?.subject!]?.name} Teacher`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              onClick={onSelectHomework}
              className="px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-blue-950 rounded-xl text-xs font-black shadow-md transition-all cursor-pointer active:scale-95 flex items-center gap-1.5"
            >
              <span>Go to Homework</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onOpenProfile}
              className="p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl transition-all cursor-pointer"
              title="Profile & Settings"
            >
              <User className="w-4 h-4" />
            </button>

            <button
              onClick={onLogout}
              className="p-2 text-rose-200 hover:text-white bg-rose-500/20 hover:bg-rose-500/40 rounded-xl transition-all cursor-pointer"
              title="Log Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}

      {/* Main Section Header */}
      <div className="text-center pt-2">
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          What would you like to see?
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
          Select an option below to enter homework, announcements, or calendar
        </p>
      </div>

      {/* The 3 Main Big Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* 1. HOMEWORK BUTTON */}
        <motion.div
          whileHover={{ scale: 1.02, y: -4 }}
          whileTap={{ scale: 0.98 }}
          onClick={onSelectHomework}
          className="group relative bg-white hover:bg-gradient-to-b hover:from-white hover:to-blue-50/50 rounded-3xl p-6 shadow-xl shadow-slate-200/70 hover:shadow-2xl hover:shadow-blue-500/20 border-2 border-slate-200/80 hover:border-blue-500 transition-all cursor-pointer flex flex-col justify-between overflow-hidden"
        >
          <div className="absolute top-0 right-0 -mt-6 -mr-6 w-28 h-28 bg-blue-500/10 rounded-full blur-xl pointer-events-none group-hover:bg-blue-500/20 transition-all" />

          <div>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center text-3xl shadow-lg shadow-blue-500/30 mb-4 border border-blue-400/40 group-hover:scale-105 transition-transform">
              🎒
            </div>

            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                Core Subjects
              </span>
              {session && (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Logged In ✓
                </span>
              )}
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-slate-900 group-hover:text-blue-700 transition-colors">
              Homework
            </h3>

            <p className="text-xs text-slate-500 font-medium mt-2 leading-relaxed">
              Daily homework for English, TWAU, Maths & Hindi. Complete notebook tasks, download worksheets, and ask doubts to teachers.
            </p>

            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 font-medium">
              {session ? (
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Opens your dashboard directly without asking!
                </span>
              ) : (
                <span className="text-blue-600 font-bold">
                  Asks "Who are you?" once, then remembers you!
                </span>
              )}
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs font-black text-blue-700 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
              <span>{session ? 'Open My Homework' : 'Open Homework'}</span>
              <span>→</span>
            </span>
            <span className="w-8 h-8 rounded-xl bg-blue-50 group-hover:bg-blue-600 text-blue-600 group-hover:text-white flex items-center justify-center font-bold text-sm transition-all shadow-xs">
              →
            </span>
          </div>
        </motion.div>

        {/* 2. ANNOUNCEMENT BUTTON */}
        <motion.div
          whileHover={{ scale: 1.02, y: -4 }}
          whileTap={{ scale: 0.98 }}
          onClick={onSelectAnnouncements}
          className="group relative bg-white hover:bg-gradient-to-b hover:from-white hover:to-amber-50/50 rounded-3xl p-6 shadow-xl shadow-slate-200/70 hover:shadow-2xl hover:shadow-amber-500/20 border-2 border-slate-200/80 hover:border-amber-500 transition-all cursor-pointer flex flex-col justify-between overflow-hidden"
        >
          <div className="absolute top-0 right-0 -mt-6 -mr-6 w-28 h-28 bg-amber-500/10 rounded-full blur-xl pointer-events-none group-hover:bg-amber-500/20 transition-all" />

          <div>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center text-3xl shadow-lg shadow-amber-500/30 mb-4 border border-amber-400/40 group-hover:scale-105 transition-transform">
              📢
            </div>

            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                School Notice Board
              </span>
              {unreadAnnouncementsCount > 0 && (
                <span className="text-[10px] font-black uppercase bg-rose-500 text-white px-2 py-0.5 rounded-full animate-bounce">
                  {unreadAnnouncementsCount} New!
                </span>
              )}
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-slate-900 group-hover:text-amber-700 transition-colors">
              Announcement
            </h3>

            <p className="text-xs text-slate-500 font-medium mt-2 leading-relaxed">
              Teachers can paste announcements for students. Students receive notices in real-time just like teachers receive doubts!
            </p>

            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 font-medium">
              <span className="text-amber-700 font-bold">
                Exam alerts, holiday circulars & official news
              </span>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs font-black text-amber-700 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
              <span>View Announcements</span>
              <span>→</span>
            </span>
            <span className="w-8 h-8 rounded-xl bg-amber-50 group-hover:bg-amber-600 text-amber-700 group-hover:text-white flex items-center justify-center font-bold text-sm transition-all shadow-xs">
              →
            </span>
          </div>
        </motion.div>

        {/* 3. CALENDAR BUTTON */}
        <motion.div
          whileHover={{ scale: 1.02, y: -4 }}
          whileTap={{ scale: 0.98 }}
          onClick={onSelectCalendar}
          className="group relative bg-white hover:bg-gradient-to-b hover:from-white hover:to-purple-50/50 rounded-3xl p-6 shadow-xl shadow-slate-200/70 hover:shadow-2xl hover:shadow-purple-500/20 border-2 border-slate-200/80 hover:border-purple-500 transition-all cursor-pointer flex flex-col justify-between overflow-hidden"
        >
          <div className="absolute top-0 right-0 -mt-6 -mr-6 w-28 h-28 bg-purple-500/10 rounded-full blur-xl pointer-events-none group-hover:bg-purple-500/20 transition-all" />

          <div>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white flex items-center justify-center text-3xl shadow-lg shadow-purple-500/30 mb-4 border border-purple-400/40 group-hover:scale-105 transition-transform">
              📅
            </div>

            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
                School Holidays
              </span>
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                Interactive
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-slate-900 group-hover:text-purple-700 transition-colors">
              Calendar
            </h3>

            <p className="text-xs text-slate-500 font-medium mt-2 leading-relaxed">
              See when is school holiday, 2nd Saturdays, Sundays, festivals & upcoming breaks. Academic dates can be updated anytime.
            </p>

            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 font-medium">
              <span className="text-purple-700 font-bold">
                Check whether school is open or holiday
              </span>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs font-black text-purple-700 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
              <span>Open Calendar</span>
              <span>→</span>
            </span>
            <span className="w-8 h-8 rounded-xl bg-purple-50 group-hover:bg-purple-600 text-purple-700 group-hover:text-white flex items-center justify-center font-bold text-sm transition-all shadow-xs">
              →
            </span>
          </div>
        </motion.div>
      </div>

      {/* Homework History Secondary Card */}
      <motion.div
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={onSelectHistory}
        className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white rounded-3xl p-5 sm:p-6 shadow-xl cursor-pointer border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
      >
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-2xl shrink-0">
            📜
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase text-blue-300 bg-blue-900/80 px-2 py-0.5 rounded-full border border-blue-700">
                Timeline Archive
              </span>
              <span className="text-xs text-slate-400">Past Dates</span>
            </div>
            <h4 className="text-base sm:text-lg font-black text-white mt-0.5">
              Complete Homework & Submission History
            </h4>
            <p className="text-xs text-slate-300">
              Open whole history on a dedicated new page for both students and teachers.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onSelectHistory}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black shrink-0 self-start sm:self-auto cursor-pointer shadow-md"
        >
          View Whole History →
        </button>
      </motion.div>

      {/* Password Management & Safety Options */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
        <button
          type="button"
          onClick={onOpenChangePassword}
          className="w-full sm:w-auto text-xs font-bold text-slate-600 hover:text-emerald-700 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
        >
          <Key className="w-3.5 h-3.5 text-emerald-600" />
          <span>Change Teacher Password</span>
        </button>

        <button
          type="button"
          onClick={onOpenStudentChangePassword}
          className="w-full sm:w-auto text-xs font-bold text-slate-600 hover:text-blue-700 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
        >
          <Key className="w-3.5 h-3.5 text-blue-600" />
          <span>Change Student Password</span>
        </button>
      </div>

      {/* Footer Info */}
      <div className="text-center pt-2 text-[11px] text-slate-500 font-medium">
        PM SHRI Kendriya Vidyalaya Mandla • Class 5 Homework & Resource Portal
      </div>
    </div>
  );
};
