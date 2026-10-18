import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Lock, AlertCircle, Eye, EyeOff, ShieldCheck, Key } from 'lucide-react';
import { api } from '../lib/api';
import { UserSession } from '../types';

interface TeacherLoginModalProps {
  onBack: () => void;
  onSuccess: (session: UserSession) => void;
  onChangePassword?: () => void;
}

export const TeacherLoginModal: React.FC<TeacherLoginModalProps> = ({ onBack, onSuccess, onChangePassword }) => {
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const [attemptsLeft, setAttemptsLeft] = useState<number>(3);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check initial lockout state from server
  useEffect(() => {
    const fetchLockStatus = async () => {
      try {
        const status = await api.getLockStatus('teacher');
        if (status.isLocked) {
          setIsLocked(true);
          setRemainingSeconds(status.remainingSeconds);
        } else {
          setAttemptsLeft(status.attemptsLeft ?? 3);
        }
      } catch (err) {
        console.error('Failed to get teacher lock status:', err);
      }
    };
    fetchLockStatus();
  }, []);

  // 15-minute countdown timer
  useEffect(() => {
    if (isLocked && remainingSeconds > 0) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            setIsLocked(false);
            setError(null);
            setAttemptsLeft(3);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isLocked, remainingSeconds]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked || loading) return;

    if (!password.trim()) {
      setError("Please enter teacher's special password.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.teacherLogin(password.trim());

      if (response.success && response.teacher && response.token) {
        localStorage.setItem('class5_token', response.token);
        const cachedAvatar =
          localStorage.getItem(`class5_avatar_teacher_${response.teacher.subject}`) ||
          localStorage.getItem('class5_my_avatar') ||
          '';
        const effectiveAvatar = response.teacher.avatar || cachedAvatar || '';
        const session: UserSession = {
          role: 'teacher',
          token: response.token,
          teacher: {
            ...response.teacher,
            avatar: effectiveAvatar,
          },
          avatar: effectiveAvatar,
        };
        localStorage.setItem('class5_session', JSON.stringify(session));
        if (effectiveAvatar) {
          localStorage.setItem('class5_my_avatar', effectiveAvatar);
          localStorage.setItem(`class5_avatar_teacher_${response.teacher.subject}`, effectiveAvatar);
        }
        onSuccess(session);
      } else {
        setError(response.error || 'Incorrect Teacher Password.');
        if (response.lockStatus) {
          if (response.lockStatus.isLocked) {
            setIsLocked(true);
            setRemainingSeconds(response.lockStatus.remainingSeconds);
          } else {
            setAttemptsLeft(response.lockStatus.attemptsLeft);
          }
        }
      }
    } catch (err) {
      setError("Oops! We couldn't catch the network. Please check your internet connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto min-h-[calc(100vh-80px)] flex flex-col justify-center px-4 py-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 relative"
      >
        {/* Top Back & Indicator */}
        <div className="flex items-center justify-between mb-4">
          <button
            id="teacher-login-back-btn"
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition-all active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            Faculty Access
          </span>
        </div>

        {/* Title */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-emerald-100 text-emerald-700 rounded-2xl mb-2 text-2xl font-black shadow-inner">
            👩‍🏫
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 block mb-1">
            PM SHRI Kendriya Vidyalaya Mandla
          </span>
          <h2 className="text-2xl font-black text-slate-900">
            Enter Teacher's Special Password
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Class 5 Subject Teachers: English, TWAU, Maths & Hindi
          </p>
        </div>

        {/* Lockout Screen */}
        {isLocked ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-red-50 border-2 border-red-200 rounded-2xl p-5 text-center my-4"
          >
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
              <Lock className="w-6 h-6 animate-pulse" />
            </div>
            <h3 className="text-lg font-bold text-red-800">
              🔒 Teacher Login Locked for 15 Minutes
            </h3>
            <p className="text-xs text-red-600 mt-1">
              Too many incorrect password attempts (3/3). Please wait for the security countdown.
            </p>
            <div className="mt-4 bg-white border border-red-200 rounded-xl py-3 px-4 shadow-sm inline-block">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Time Remaining
              </span>
              <span className="text-2xl font-mono font-black text-red-600">
                {formatTime(remainingSeconds)}
              </span>
            </div>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <label
                htmlFor="teacher-password-input"
                className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5"
              >
                <Key className="w-3.5 h-3.5 text-emerald-600" />
                <span>Special Access Code</span>
              </label>

              <div className="relative">
                <input
                  id="teacher-password-input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null);
                  }}
                  placeholder="Enter 4-digit code"
                  autoFocus
                  className="w-full text-center text-2xl font-mono font-bold tracking-widest py-3 px-10 bg-slate-50 border-2 border-emerald-300 focus:border-emerald-600 rounded-2xl shadow-inner focus:outline-none transition-all text-slate-900 placeholder:text-slate-300"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
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

            <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
              <span className="flex items-center gap-1 text-slate-600">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Encrypted Server Auth
              </span>
              <span className="font-semibold text-amber-600">
                Attempts remaining: {attemptsLeft}/3
              </span>
            </div>

            {/* Submit Button */}
            <motion.button
              id="teacher-login-submit-btn"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading || !password.trim()}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-3.5 px-4 rounded-2xl shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 text-base transition-all cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <span>Access Teacher Dashboard</span>
              )}
            </motion.button>

            {onChangePassword && (
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={onChangePassword}
                  className="text-xs text-slate-500 hover:text-emerald-700 font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Key className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Need to change your password?</span>
                </button>
              </div>
            )}
          </form>
        )}
      </motion.div>
    </div>
  );
};
