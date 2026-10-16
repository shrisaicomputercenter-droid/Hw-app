import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, LogOut, User, Calendar, Award, Shield, School, BookOpen, Key, Sparkles, Camera } from 'lucide-react';
import { UserSession } from '../types';
import { SUBJECTS_CONFIG } from '../studentData';
import { ClassPasswordsModal } from './ClassPasswordsModal';
import { UserAvatar } from './UserAvatar';
import { ChangeDpModal } from './ChangeDpModal';

interface ProfileModalProps {
  session: UserSession;
  onClose: () => void;
  onLogout: () => void;
  onChangePassword?: () => void;
  onStudentChangePassword?: () => void;
  onAvatarUpdated?: (newAvatar: string | null) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  session,
  onClose,
  onLogout,
  onChangePassword,
  onStudentChangePassword,
  onAvatarUpdated,
}) => {
  const [showClassPasswords, setShowClassPasswords] = useState<boolean>(false);
  const [showChangeDp, setShowChangeDp] = useState<boolean>(false);
  const isStudent = session.role === 'student';
  const student = session.student;
  const teacher = session.teacher;

  // Check if current user is Smriti Ma'am
  const isSmriti =
    !isStudent &&
    (teacher?.subject === 'twau' ||
      teacher?.id === 'teacher_twau' ||
      Boolean(teacher?.name && teacher.name.toLowerCase().includes('smriti')));

  const currentAvatar =
    session.avatar ||
    (isStudent ? student?.avatar : teacher?.avatar) ||
    '';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-100 relative max-h-[92vh] overflow-y-auto"
      >
        {/* Close Button */}
        <button
          id="close-profile-modal-btn"
          onClick={onClose}
          className="absolute right-4 top-4 p-2 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Profile Header */}
        <div className="text-center pb-5 border-b border-slate-100">
          <div className="flex flex-col items-center mb-2">
            <UserAvatar
              avatar={currentAvatar}
              role={session.role}
              defaultIcon={teacher?.subject ? SUBJECTS_CONFIG[teacher.subject]?.flag : undefined}
              size="2xl"
              showCameraBadge
              onCameraClick={() => setShowChangeDp(true)}
              onClick={() => setShowChangeDp(true)}
              borderClass="border-4 border-white shadow-xl shadow-blue-500/20"
              title="Click to Change DP / Profile Picture"
            />

            <button
              id="profile-change-dp-btn"
              type="button"
              onClick={() => setShowChangeDp(true)}
              className="mt-2.5 text-xs font-bold text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-1 rounded-full border border-blue-200 inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Change DP / Icon</span>
            </button>
          </div>

          <span className="text-xs font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
            {isStudent ? 'Class 5 Student' : 'School Faculty'}
          </span>

          <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
            {isStudent ? student?.name : teacher?.name}
          </h3>

          <p className="text-xs text-slate-500 font-medium">
            {isStudent
              ? `Class 5 • Roll No. ${student?.rollNo}`
              : `${SUBJECTS_CONFIG[teacher?.subject!]?.name} Faculty`}
          </p>
          <p className="text-[11px] font-bold text-blue-900 mt-1">
            PM SHRI Kendriya Vidyalaya Mandla
          </p>
        </div>

        {/* Details Grid */}
        <div className="py-5 space-y-3">
          {/* Change DP Quick Action */}
          <button
            id="profile-action-change-dp-btn"
            type="button"
            onClick={() => setShowChangeDp(true)}
            className="w-full flex items-center justify-between p-3 bg-blue-50/80 hover:bg-blue-100/80 border border-blue-200 rounded-2xl text-xs font-bold text-blue-800 transition-all cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-blue-600" />
              <span>Change Profile Picture (DP)</span>
            </span>
            <span className="text-blue-600 font-bold">Edit →</span>
          </button>

          {isStudent ? (
            <>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs">
                <span className="font-bold text-slate-500 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-blue-600" />
                  Roll Number
                </span>
                <span className="font-mono font-black text-slate-900 text-sm">
                  {student?.rollNo}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs">
                <span className="font-bold text-slate-500 flex items-center gap-1.5">
                  <School className="w-4 h-4 text-emerald-600" />
                  School & Class
                </span>
                <div className="text-right">
                  <span className="font-black text-slate-900 text-xs block">
                    PM SHRI KVS Mandla
                  </span>
                  <span className="font-semibold text-slate-500 text-[11px]">
                    Class 5 (Primary Section)
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs">
                <span className="font-bold text-slate-500 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-rose-500" />
                  Date of Birth
                </span>
                <span className="font-bold text-slate-900 text-sm">
                  {student?.dob}
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs">
                <span className="font-bold text-slate-500 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-emerald-600" />
                  Assigned Subject
                </span>
                <span className="font-black text-slate-900 text-sm flex items-center gap-1">
                  <span>{SUBJECTS_CONFIG[teacher?.subject!]?.flag}</span>
                  <span>{SUBJECTS_CONFIG[teacher?.subject!]?.name}</span>
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs">
                <span className="font-bold text-slate-500 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-blue-600" />
                  Faculty ID
                </span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {teacher?.id}
                </span>
              </div>

              {/* EXCLUSIVE TO SMRITI MA'AM: Class Passwords Directory */}
              {isSmriti && (
                <div className="p-4 bg-gradient-to-br from-indigo-50 via-purple-50 to-indigo-100/60 rounded-2xl border-2 border-indigo-300 shadow-sm space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                        🔑
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-indigo-950 uppercase tracking-wider">
                          Class 5 Passwords Directory
                        </h4>
                        <p className="text-[10px] text-indigo-700 font-bold">
                          Exclusive to Mrs. Smriti Vats Ma'am
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold bg-indigo-200 text-indigo-900 px-2 py-0.5 rounded-full">
                      41 Students
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                    When a student forgets their password in school, they can ask you. Click below to view all student passwords or reset them!
                  </p>

                  <button
                    id="smriti-view-passwords-btn"
                    type="button"
                    onClick={() => setShowClassPasswords(true)}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-indigo-600/25 transition-all cursor-pointer"
                  >
                    <Key className="w-3.5 h-3.5" />
                    <span>View All Class Passwords</span>
                    <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                  </button>
                </div>
              )}

              {isStudent
                ? onStudentChangePassword && (
                    <button
                      id="profile-change-pw-btn"
                      type="button"
                      onClick={() => {
                        onClose();
                        onStudentChangePassword();
                      }}
                      className="w-full flex items-center justify-between p-3 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 rounded-2xl text-xs font-bold text-emerald-800 transition-all cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5">
                        <Key className="w-4 h-4 text-emerald-600" />
                        <span>Change My Password</span>
                      </span>
                      <span className="text-emerald-700">Edit →</span>
                    </button>
                  )
                : onChangePassword && (
                    <button
                      id="profile-change-pw-btn"
                      type="button"
                      onClick={() => {
                        onClose();
                        onChangePassword();
                      }}
                      className="w-full flex items-center justify-between p-3 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 rounded-2xl text-xs font-bold text-emerald-800 transition-all cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5">
                        <Key className="w-4 h-4 text-emerald-600" />
                        <span>Change Special Password</span>
                      </span>
                      <span className="text-emerald-700">Edit →</span>
                    </button>
                  )}
            </>
          )}
        </div>

        {/* Log Out Button (Requirement 10) */}
        <div className="pt-2">
          <motion.button
            id="profile-logout-btn"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onLogout}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-3.5 px-4 rounded-2xl shadow-lg shadow-red-500/25 flex items-center justify-center gap-2 text-base transition-all cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
            <span>Log Out</span>
          </motion.button>
          <p className="text-[11px] text-slate-400 text-center mt-2">
            Logs out session and returns to "Who are you?"
          </p>
        </div>
      </motion.div>

      {/* Smriti Ma'am Class Passwords Directory Modal */}
      {isSmriti && (
        <ClassPasswordsModal
          isOpen={showClassPasswords}
          onClose={() => setShowClassPasswords(false)}
          teacherName={teacher?.name}
        />
      )}

      {/* Change DP Modal */}
      <ChangeDpModal
        isOpen={showChangeDp}
        session={session}
        onClose={() => setShowChangeDp(false)}
        onAvatarUpdated={(newAvatar) => {
          if (onAvatarUpdated) {
            onAvatarUpdated(newAvatar);
          }
        }}
      />
    </div>
  );
};
