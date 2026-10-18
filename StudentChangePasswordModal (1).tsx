import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Key, AlertCircle, CheckCircle2, Eye, EyeOff, User, GraduationCap, ShieldAlert } from 'lucide-react';
import { api } from '../lib/api';
import { CLASS_5_STUDENTS } from '../studentData';
import { Student } from '../types';

interface StudentChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StudentChangePasswordModal: React.FC<StudentChangePasswordModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [selectedRoll, setSelectedRoll] = useState<number>(501);
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showCurrentPass, setShowCurrentPass] = useState<boolean>(false);
  const [showNewPass, setShowNewPass] = useState<boolean>(false);
  const [showConfirmPass, setShowConfirmPass] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleResetForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError(null);
    setSuccessMessage(null);
  };

  const handleClose = () => {
    handleResetForm();
    onClose();
  };

  const selectedStudent: Student | undefined = CLASS_5_STUDENTS.find((s) => s.rollNo === selectedRoll);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setError(null);
    setSuccessMessage(null);

    if (!selectedRoll) {
      setError('Please select your name or roll number.');
      return;
    }

    if (!currentPassword.trim()) {
      setError('Please enter your current password (default is your roll number).');
      return;
    }

    if (!newPassword.trim()) {
      setError('Please enter your new password.');
      return;
    }

    if (newPassword.trim().length < 2) {
      setError('New password must be at least 2 characters or numbers long.');
      return;
    }

    if (newPassword.trim() !== confirmPassword.trim()) {
      setError('New passwords do not match. Please verify.');
      return;
    }

    if (currentPassword.trim().toLowerCase() === newPassword.trim().toLowerCase()) {
      setError('New password cannot be identical to your old password.');
      return;
    }

    setLoading(true);

    try {
      const response = await api.changeStudentPassword({
        rollNo: selectedRoll,
        currentPassword: currentPassword.trim(),
        newPassword: newPassword.trim(),
      });

      if (response.success) {
        setSuccessMessage(
          response.message ||
            `Password for ${selectedStudent?.name || 'student'} has been successfully updated!`
        );
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setError(
          response.error ||
            "Incorrect current password. If you forgot it, please ask Smriti Ma'am in school."
        );
      }
    } catch (err: any) {
      setError(err?.message || "Oops! Could not catch network. Please check your internet connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-6"
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm text-xl border border-white/30 shrink-0">
              🔑
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-extrabold text-lg text-white leading-tight">
                  Change Student Password
                </h3>
              </div>
              <p className="text-xs text-blue-100 font-medium">
                PM SHRI Kendriya Vidyalaya Mandla • Class 5
              </p>
            </div>
          </div>

          <button
            id="student-change-pw-close-btn"
            onClick={handleClose}
            className="text-white/80 hover:text-white p-2 rounded-xl hover:bg-white/15 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 max-h-[80vh] overflow-y-auto">
          {successMessage ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-6 space-y-4"
            >
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <div>
                <h4 className="text-xl font-black text-slate-900">
                  Password Updated Successfully!
                </h4>
                <p className="text-sm text-slate-600 mt-2 max-w-sm mx-auto">
                  {successMessage}
                </p>
                <div className="mt-3 bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-800 font-medium">
                  ✓ You can now use your new password to log in.
                  <br />
                  <span className="text-slate-500 text-[11px] block mt-1">
                    If you ever forget your password, you can ask Smriti Ma'am at school!
                  </span>
                </div>
              </div>

              <div className="pt-3">
                <button
                  id="student-change-pw-done-btn"
                  onClick={handleClose}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-2xl shadow-lg shadow-blue-600/30 transition-all cursor-pointer text-sm"
                >
                  Done & Back to Home
                </button>
              </div>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Notice Banner */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex items-start gap-3 text-xs text-amber-900">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold block">First Time Changing Password?</strong>
                  <span>
                    Your initial default password is your <strong>Roll Number</strong> (e.g. 501).
                    If you forgot your password, you can ask <strong>Smriti Ma'am</strong> at school!
                  </span>
                </div>
              </div>

              {/* Step 1: Select Student */}
              <div>
                <label
                  htmlFor="student-select-roll"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center justify-between"
                >
                  <span>1. Select Your Name / Roll Number</span>
                  <span className="text-[11px] text-blue-600 font-semibold normal-case">
                    Class 5 (501 - 541)
                  </span>
                </label>
                <div className="relative">
                  <select
                    id="student-select-roll"
                    value={selectedRoll}
                    onChange={(e) => {
                      setSelectedRoll(parseInt(e.target.value, 10));
                      setError(null);
                    }}
                    className="w-full py-2.5 px-3.5 bg-slate-50 border border-slate-300 focus:border-blue-600 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none transition-all cursor-pointer"
                  >
                    {CLASS_5_STUDENTS.map((st) => (
                      <option key={st.rollNo} value={st.rollNo}>
                        Roll {st.rollNo} — {st.name}
                      </option>
                    ))}
                  </select>
                </div>
                {selectedStudent && (
                  <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 font-medium">
                    <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
                    <span>Selected: <strong>{selectedStudent.name}</strong> (Roll {selectedStudent.rollNo})</span>
                  </p>
                )}
              </div>

              {/* Step 2: Current Password */}
              <div>
                <label
                  htmlFor="student-change-current-pw"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
                >
                  2. Current Password
                </label>
                <div className="relative">
                  <input
                    id="student-change-current-pw"
                    type={showCurrentPass ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => {
                      setCurrentPassword(e.target.value);
                      setError(null);
                    }}
                    placeholder={`Current password (initially ${selectedRoll})`}
                    className="w-full py-2.5 px-4 pr-11 bg-slate-50 border border-slate-300 focus:border-blue-600 rounded-xl text-sm font-medium focus:outline-none transition-all text-slate-900 placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  >
                    {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Default password is your Roll Number (e.g. {selectedRoll}).
                </p>
              </div>

              {/* Step 3: New Password & Confirm New Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label
                    htmlFor="student-change-new-pw"
                    className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
                  >
                    3. New Password
                  </label>
                  <div className="relative">
                    <input
                      id="student-change-new-pw"
                      type={showNewPass ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        setError(null);
                      }}
                      placeholder="Enter new password"
                      className="w-full py-2.5 px-4 pr-11 bg-slate-50 border border-slate-300 focus:border-blue-600 rounded-xl text-sm font-medium focus:outline-none transition-all text-slate-900 placeholder:text-slate-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                    >
                      {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="student-change-confirm-pw"
                    className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
                  >
                    4. Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      id="student-change-confirm-pw"
                      type={showConfirmPass ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setError(null);
                      }}
                      placeholder="Re-enter new password"
                      className="w-full py-2.5 px-4 pr-11 bg-slate-50 border border-slate-300 focus:border-blue-600 rounded-xl text-sm font-medium focus:outline-none transition-all text-slate-900 placeholder:text-slate-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPass(!showConfirmPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                    >
                      {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Error banner */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700 font-medium"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                    <span>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-5 py-3 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>

                <motion.button
                  id="student-change-pw-submit-btn"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={
                    loading ||
                    !currentPassword.trim() ||
                    !newPassword.trim() ||
                    !confirmPassword.trim()
                  }
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-3 px-5 rounded-xl shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 text-xs sm:text-sm transition-all cursor-pointer"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Key className="w-4 h-4" />
                      <span>Update Student Password</span>
                    </>
                  )}
                </motion.button>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};
