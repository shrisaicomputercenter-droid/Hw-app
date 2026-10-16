import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Key, Search, Copy, Check, RotateCcw, ShieldAlert, Sparkles, UserCheck } from 'lucide-react';
import { api } from '../lib/api';
import { StudentPasswordInfo } from '../types';

interface ClassPasswordsModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacherName?: string;
}

export const ClassPasswordsModal: React.FC<ClassPasswordsModalProps> = ({
  isOpen,
  onClose,
  teacherName,
}) => {
  const [students, setStudents] = useState<StudentPasswordInfo[]>([]);
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedRoll, setCopiedRoll] = useState<number | null>(null);
  const [resettingRoll, setResettingRoll] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const fetchPasswords = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.getClassPasswords();
        if (res.success && res.students) {
          setStudents(res.students);
        } else {
          setError(res.error || 'Failed to load class passwords.');
        }
      } catch (err: any) {
        setError(err?.message || 'Error fetching passwords.');
      } finally {
        setLoading(false);
      }
    };

    fetchPasswords();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = (rollNo: number, password: string) => {
    navigator.clipboard.writeText(password);
    setCopiedRoll(rollNo);
    setTimeout(() => setCopiedRoll(null), 2000);
  };

  const handleResetPassword = async (st: StudentPasswordInfo) => {
    const confirmReset = window.confirm(
      `Are you sure you want to reset the password for ${st.name} (Roll ${st.rollNo}) back to default "${st.rollNo}"?`
    );
    if (!confirmReset) return;

    setResettingRoll(st.rollNo);
    try {
      const res = await api.resetStudentPassword(st.rollNo);
      if (res.success) {
        setStudents((prev) =>
          prev.map((s) =>
            s.rollNo === st.rollNo
              ? { ...s, password: st.rollNo.toString(), isDefault: true }
              : s
          )
        );
        setToastMessage(`Reset password for ${st.name} to ${st.rollNo}`);
        setTimeout(() => setToastMessage(null), 3000);
      } else {
        alert(res.error || 'Failed to reset password.');
      }
    } catch (e: any) {
      alert(e?.message || 'Network error.');
    } finally {
      setResettingRoll(null);
    }
  };

  const filteredStudents = students.filter(
    (st) =>
      st.name.toLowerCase().includes(search.toLowerCase()) ||
      st.rollNo.toString().includes(search)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/65 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh] my-4"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-700 via-purple-700 to-indigo-800 text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm text-2xl border border-white/30 shrink-0">
              🔑
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-lg text-white leading-tight">
                  Class 5 Student Passwords Directory
                </h3>
                <span className="bg-amber-400 text-amber-950 text-[10px] font-black uppercase px-2 py-0.5 rounded-md">
                  Smriti Ma'am Only
                </span>
              </div>
              <p className="text-xs text-indigo-200 font-medium mt-0.5">
                Authorized: {teacherName || "Mrs. Smriti Vats Ma'am"} • Class 5 Incharge
              </p>
            </div>
          </div>

          <button
            id="class-passwords-close-btn"
            onClick={onClose}
            className="text-white/80 hover:text-white p-2 rounded-xl hover:bg-white/15 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info Banner & Search */}
        <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 shrink-0 space-y-3">
          <div className="flex items-start gap-2.5 bg-indigo-50/80 border border-indigo-200 rounded-2xl p-3 text-xs text-indigo-950">
            <ShieldAlert className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Assistance for Students</span>
              <span>
                If any student forgets their password at school, they can ask you here. You can view their active password or reset it back to their Roll Number.
              </span>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="search-student-passwords-input"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by student name or roll number (e.g. 501, Aarav)..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 focus:border-indigo-600 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all shadow-xs"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            )}
          </div>

          {/* Quick Stats */}
          <div className="flex items-center justify-between text-xs text-slate-600 px-1">
            <span>
              Showing <strong>{filteredStudents.length}</strong> of {students.length} students
            </span>
            <span className="text-[11px] text-indigo-700 font-semibold">
              PM SHRI KV Mandla • Class 5
            </span>
          </div>
        </div>

        {/* Toast Notification */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-emerald-600 text-white text-xs font-bold px-4 py-2 text-center"
            >
              ✓ {toastMessage}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scrollable Students Password List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {loading ? (
            <div className="py-12 text-center">
              <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-xs text-slate-500 font-medium">Loading class passwords securely...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-center text-xs text-red-700 font-medium my-4">
              {error}
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              No students found matching "{search}".
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredStudents.map((st) => {
                const isCopied = copiedRoll === st.rollNo;
                const isResetting = resettingRoll === st.rollNo;

                return (
                  <div
                    key={st.rollNo}
                    className="p-3.5 bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Row: Roll + Status */}
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-mono font-black text-xs px-2 py-0.5 bg-slate-100 text-slate-800 rounded-lg border border-slate-200">
                          Roll {st.rollNo}
                        </span>
                        {st.isDefault ? (
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md">
                            Default (Roll No)
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5" />
                            Custom Password
                          </span>
                        )}
                      </div>

                      {/* Student Name */}
                      <h4 className="font-bold text-sm text-slate-900 truncate">
                        {st.name}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-medium">
                        DOB: {st.dob}
                      </p>
                    </div>

                    {/* Password Box & Actions */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div className="flex-1 bg-indigo-50/60 border border-indigo-100 rounded-xl px-2.5 py-1.5 flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-indigo-600 block">
                          PW:
                        </span>
                        <span className="font-mono font-black text-sm text-indigo-950 tracking-wider">
                          {st.password}
                        </span>
                      </div>

                      {/* Copy Password Button */}
                      <button
                        type="button"
                        onClick={() => handleCopy(st.rollNo, st.password)}
                        className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer active:scale-95"
                        title="Copy Password"
                      >
                        {isCopied ? (
                          <Check className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>

                      {/* Reset to Default Button */}
                      {!st.isDefault && (
                        <button
                          type="button"
                          disabled={isResetting}
                          onClick={() => handleResetPassword(st)}
                          className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer active:scale-95"
                          title="Reset back to default Roll Number"
                        >
                          <RotateCcw className={`w-3 h-3 ${isResetting ? 'animate-spin' : ''}`} />
                          <span>Reset</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <p className="text-xs text-slate-500">
            Confidential directory for Smriti Ma'am's classroom administration.
          </p>
          <button
            id="class-passwords-done-btn"
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-sm"
          >
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
};
