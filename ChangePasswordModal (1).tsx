import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Key, ShieldCheck, AlertCircle, CheckCircle2, Eye, EyeOff, BookOpen, Microscope, Divide, Languages } from 'lucide-react';
import { api } from '../lib/api';
import { SubjectKey } from '../types';
import { SUBJECTS_CONFIG, SUBJECT_ORDER } from '../studentData';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose }) => {
  const [selectedSubject, setSelectedSubject] = useState<SubjectKey>('english');
  const [oldPassword, setOldPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showOldPass, setShowOldPass] = useState<boolean>(false);
  const [showNewPass, setShowNewPass] = useState<boolean>(false);
  const [showConfirmPass, setShowConfirmPass] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleResetForm = () => {
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError(null);
    setSuccessMessage(null);
  };

  const handleClose = () => {
    handleResetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setError(null);
    setSuccessMessage(null);

    if (!selectedSubject) {
      setError('Please select the subject you teach.');
      return;
    }

    if (!oldPassword.trim()) {
      setError('Please enter your current (old) password.');
      return;
    }

    if (!newPassword.trim()) {
      setError('Please enter your new password.');
      return;
    }

    if (newPassword.trim().length < 3) {
      setError('New password must be at least 3 characters or digits long.');
      return;
    }

    if (newPassword.trim() !== confirmPassword.trim()) {
      setError('New passwords do not match. Please verify.');
      return;
    }

    if (oldPassword.trim() === newPassword.trim()) {
      setError('New password must be different from your old password.');
      return;
    }

    setLoading(true);

    try {
      const response = await api.changeTeacherPassword(
        selectedSubject,
        oldPassword.trim(),
        newPassword.trim()
      );

      if (response.success) {
        setSuccessMessage(
          response.message || `Password for ${SUBJECTS_CONFIG[selectedSubject]?.name} teacher successfully updated!`
        );
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setError(response.error || 'Failed to update password. Please check your current password.');
      }
    } catch (err: any) {
      setError(err?.message || "Oops! Could not catch network. Please check your internet connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const getSubjectIcon = (key: SubjectKey) => {
    switch (key) {
      case 'english':
        return <BookOpen className="w-4 h-4 text-emerald-600" />;
      case 'twau':
        return <Microscope className="w-4 h-4 text-indigo-600" />;
      case 'maths':
        return <Divide className="w-4 h-4 text-amber-600" />;
      case 'hindi':
        return <Languages className="w-4 h-4 text-orange-600" />;
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
        <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm text-xl border border-white/30 shrink-0">
              🔑
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-extrabold text-lg text-white leading-tight">
                  Change Teacher Password
                </h3>
              </div>
              <p className="text-xs text-emerald-100 font-medium">
                PM SHRI Kendriya Vidyalaya Mandla
              </p>
            </div>
          </div>

          <button
            id="change-pw-close-btn"
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
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <div>
                <h4 className="text-xl font-black text-slate-900">
                  Password Changed Successfully!
                </h4>
                <p className="text-sm text-slate-600 mt-2 max-w-sm mx-auto">
                  {successMessage}
                </p>
                <p className="text-xs text-emerald-700 font-bold mt-2">
                  ✓ You can now use your new password when logging into the Teacher Dashboard.
                </p>
              </div>

              <div className="pt-3">
                <button
                  id="change-pw-done-btn"
                  onClick={handleClose}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-8 rounded-2xl shadow-lg shadow-emerald-600/30 transition-all cursor-pointer text-sm"
                >
                  Done & Back to Home
                </button>
              </div>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Step 1: Subject Selection */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center justify-between">
                  <span>1. Select the subject you teach</span>
                  <span className="text-[11px] text-emerald-700 font-semibold lowercase">
                    {SUBJECTS_CONFIG[selectedSubject]?.teacherName}
                  </span>
                </label>

                <div className="grid grid-cols-2 gap-2.5">
                  {SUBJECT_ORDER.map((subjKey) => {
                    const cfg = SUBJECTS_CONFIG[subjKey];
                    const isSelected = selectedSubject === subjKey;
                    return (
                      <button
                        key={subjKey}
                        id={`change-pw-subj-${subjKey}`}
                        type="button"
                        onClick={() => {
                          setSelectedSubject(subjKey);
                          setError(null);
                        }}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between min-h-[78px] ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-50/80 shadow-sm ring-2 ring-emerald-500/20'
                            : 'border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-xl">{cfg.flag}</span>
                          <span
                            className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                              isSelected ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300 bg-white'
                            }`}
                          >
                            {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white"></span>}
                          </span>
                        </div>
                        <div className="mt-1">
                          <span className="font-extrabold text-sm text-slate-900 block leading-tight">
                            {cfg.name}
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium truncate block">
                            {cfg.teacherName}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Old Password */}
              <div>
                <label
                  htmlFor="change-pw-old-input"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
                >
                  2. Current / Old Password
                </label>
                <div className="relative">
                  <input
                    id="change-pw-old-input"
                    type={showOldPass ? 'text' : 'password'}
                    value={oldPassword}
                    onChange={(e) => {
                      setOldPassword(e.target.value);
                      setError(null);
                    }}
                    placeholder="Enter current password (e.g. 1234)"
                    className="w-full py-2.5 px-4 pr-11 bg-slate-50 border border-slate-300 focus:border-emerald-600 rounded-xl text-sm font-medium focus:outline-none transition-all text-slate-900 placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPass(!showOldPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  >
                    {showOldPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Step 3: New Password & Confirm New Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label
                    htmlFor="change-pw-new-input"
                    className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
                  >
                    3. New Password
                  </label>
                  <div className="relative">
                    <input
                      id="change-pw-new-input"
                      type={showNewPass ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        setError(null);
                      }}
                      placeholder="Enter new code"
                      className="w-full py-2.5 px-4 pr-11 bg-slate-50 border border-slate-300 focus:border-emerald-600 rounded-xl text-sm font-medium focus:outline-none transition-all text-slate-900 placeholder:text-slate-400"
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
                    htmlFor="change-pw-confirm-input"
                    className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
                  >
                    4. Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      id="change-pw-confirm-input"
                      type={showConfirmPass ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setError(null);
                      }}
                      placeholder="Re-enter new code"
                      className="w-full py-2.5 px-4 pr-11 bg-slate-50 border border-slate-300 focus:border-emerald-600 rounded-xl text-sm font-medium focus:outline-none transition-all text-slate-900 placeholder:text-slate-400"
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
                  id="change-pw-submit-btn"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading || !oldPassword.trim() || !newPassword.trim() || !confirmPassword.trim()}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-3 px-5 rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 text-xs sm:text-sm transition-all cursor-pointer"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Key className="w-4 h-4" />
                      <span>Update Password</span>
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
