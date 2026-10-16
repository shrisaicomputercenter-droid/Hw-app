import React from 'react';
import { motion } from 'motion/react';
import { GraduationCap, Sparkles, BookOpen, Clock, Key } from 'lucide-react';

interface LandingScreenProps {
  onSelectStudent: () => void;
  onSelectTeacher: () => void;
  onOpenChangePassword: () => void;
  onOpenStudentChangePassword: () => void;
}

export const LandingScreen: React.FC<LandingScreenProps> = ({
  onSelectStudent,
  onSelectTeacher,
  onOpenChangePassword,
  onOpenStudentChangePassword,
}) => {
  return (
    <div className="w-full max-w-md mx-auto flex flex-col items-center justify-center min-h-[calc(100vh-80px)] px-4 py-8">
      {/* School Hero Emblem */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full text-center mb-6"
      >
        <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-tr from-blue-700 via-indigo-600 to-blue-500 rounded-3xl shadow-xl shadow-blue-500/20 border-4 border-white mb-3 relative">
          <span className="text-4xl select-none animate-bounce drop-shadow-md">🏫</span>
        </div>

        <div className="inline-block bg-blue-50 text-blue-900 text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-blue-200 mb-2">
          PM SHRI Kendriya Vidyalaya Mandla
        </div>

        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
          PM SHRI Kendriya Vidyalaya Mandla
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1 font-semibold">
          Daily Homework, Student Doubts & Progress Portal
        </p>
      </motion.div>

      {/* Main Card: "Who are you?" */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.35 }}
        className="w-full bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/70 border border-slate-100 flex flex-col items-center"
      >
        <div className="text-center mb-6">
          <span className="text-xs font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200/70">
            Welcome
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
            Who are you?
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Please choose your role to continue
          </p>
        </div>

        {/* The Two Required Large Buttons */}
        <div className="w-full space-y-4">
          {/* 🎓 Student Button */}
          <motion.button
            id="role-student-btn"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onSelectStudent}
            className="w-full group relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white p-5 rounded-2xl shadow-lg shadow-blue-600/30 border-2 border-blue-500/50 flex items-center justify-between text-left transition-all cursor-pointer min-h-[80px]"
          >
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl shadow-inner border border-white/30 shrink-0">
                🎓
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-200">
                  Password Login • Class 5
                </span>
                <h3 className="text-xl sm:text-2xl font-black tracking-wide text-white flex items-center gap-2">
                  Student
                </h3>
                <p className="text-xs text-blue-100/90 font-medium mt-0.5">
                  Enter student password to view homework & tasks
                </p>
              </div>
            </div>
            <div className="hidden sm:flex items-center justify-center w-8 h-8 rounded-full bg-white/15 text-white group-hover:translate-x-1 transition-transform">
              →
            </div>
          </motion.button>

          {/* 👩‍🏫 Teacher Button */}
          <motion.button
            id="role-teacher-btn"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onSelectTeacher}
            className="w-full group relative overflow-hidden bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white p-5 rounded-2xl shadow-lg shadow-emerald-600/30 border-2 border-emerald-500/50 flex items-center justify-between text-left transition-all cursor-pointer min-h-[80px]"
          >
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl shadow-inner border border-white/30 shrink-0">
                👩‍🏫
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-200">
                  Subject Faculty
                </span>
                <h3 className="text-xl sm:text-2xl font-black tracking-wide text-white flex items-center gap-2">
                  Teacher
                </h3>
                <p className="text-xs text-emerald-100/90 font-medium mt-0.5">
                  Publish HW, check students & answer doubts
                </p>
              </div>
            </div>
            <div className="hidden sm:flex items-center justify-center w-8 h-8 rounded-full bg-white/15 text-white group-hover:translate-x-1 transition-transform">
              →
            </div>
          </motion.button>
        </div>

        {/* Password Change Options */}
        <div className="w-full mt-4 flex flex-col sm:flex-row items-center justify-center gap-2">
          {/* Teacher Change Password */}
          <button
            id="change-teacher-password-btn"
            type="button"
            onClick={onOpenChangePassword}
            className="w-full sm:w-auto text-xs font-bold text-slate-600 hover:text-emerald-700 bg-slate-50 hover:bg-emerald-50/80 border border-slate-200 hover:border-emerald-300 py-2 px-3.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
          >
            <Key className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Change Teacher Password</span>
          </button>

          {/* Student Change Password (Placed directly below/beside teachers change password) */}
          <button
            id="change-student-password-btn"
            type="button"
            onClick={onOpenStudentChangePassword}
            className="w-full sm:w-auto text-xs font-bold text-slate-600 hover:text-blue-700 bg-slate-50 hover:bg-blue-50/80 border border-slate-200 hover:border-blue-300 py-2 px-3.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
          >
            <Key className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>Change Student Password</span>
          </button>
        </div>

        {/* Subtle portal info banner */}
        <div className="w-full mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600 font-medium">
          <span className="flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5 text-blue-500" />
            4 Core Subjects
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-emerald-500" />
            Daily Updates
          </span>
          <span className="flex items-center gap-1">
            <GraduationCap className="w-3.5 h-3.5 text-purple-500" />
            41 Students
          </span>
        </div>
      </motion.div>
    </div>
  );
};
