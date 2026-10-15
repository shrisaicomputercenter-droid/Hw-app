import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Lock, AlertCircle, Sparkles, Eye, EyeOff, Key, ShieldCheck, HelpCircle } from 'lucide-react';
import { api } from '../lib/api';
import { UserSession } from '../types';

interface StudentLoginModalProps {
  onBack: () => void;
  onSuccess: (session: UserSession) => void;
  onOpenChangePassword?: () => void;
}

export const StudentLoginModal: React.FC<StudentLoginModalProps> = ({
  onBack,
  onSuccess,
  onOpenChangePassword,
}) => {
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const [attemptsLeft, setAttemptsLeft] = useState<number>(3);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Check initial lock status from server
  useEffect(() => {
    const fetchLockStatus = async () => {
      try {
        const status = await api.getLockStatus('student');
        if (status.isLocked) {
          setIsLocked(true);
          setRemainingSeconds(status.remainingSeconds);
        } else {
          setAttemptsLeft(status.attemptsLeft ?? 3);
        }
      } catch (err) {
        console.error('Failed to get lock status:', err);
      }
    };
    fetchLockStatus();
  }, []);

  // Countdown timer loop
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

  const handleKeyPress = (num: string) => {
    if (isLocked || loading) return;
    setError(null);
    setPasswordInput((prev) => prev + num);
  };

  const handleBackspace = () => {
    if (isLocked || loading) return;
    setError(null);
    setPasswordInput((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    if (isLocked || loading) return;
    setError(null);
    setPasswordInput('');
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isLocked || loading) return;

    const trimmed = passwordInput.trim();
    if (!trimmed) {
      setError('Please enter your Student Password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.studentLogin(trimmed);

      if (response.success && response.student && response.token) {
        localStorage.setItem('class5_token', response.token);
        const cachedAvatar =
          localStorage.getItem(`class5_avatar_student_${response.student.rollNo}`) ||
          localStorage.getItem('class5_my_avatar') ||
          '';
        const effectiveAvatar = response.student.avatar || cachedAvatar || '';
        const session: UserSession = {
          role: 'student',
          token: response.token,
          student: {
            ...response.student,
            avatar: effectiveAvatar,
          },
          avatar: effectiveAvatar,
        };
        localStorage.setItem('class5_session', JSON.stringify(session));
        if (effectiveAvatar) {
          localStorage.setItem('class5_my_avatar', effectiveAvatar);
          localStorage.setItem(`class5_avatar_student_${response.student.rollNo}`, effectiveAvatar);
        }
        onSuccess(session);
      } else {
        setError(
          response.error ||
            "Incorrect Student Password. If you forgot your password, please ask Smriti Ma'am in school."
        );
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
        className="bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 relative"
      >
        {/* Top Back & Step */}
        <div className="flex items-center justify-between mb-4">
          <button
            id="student-login-back-btn"
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition-all active:scale-95 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
            Student Password Login
          </span>
        </div>

        {/* Header Title */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-100 text-blue-700 rounded-2xl mb-2 text-2xl font-black shadow-inner">
            🎓
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 block mb-1">
            PM SHRI Kendriya Vidyalaya Mandla
          </span>
          <h2 className="text-2xl font-black text-slate-900">
            Enter Student Password
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Class 5 Student Portal Access
          </p>
        </div>

        {/* Informative Hint Banner */}
        <div className="mb-4 bg-blue-50/80 border border-blue-200/80 rounded-2xl p-3 text-xs text-blue-900 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">First Time Logging In?</span>
            <span className="text-[11px] text-blue-800">
              For now, your password is your <strong>Roll Number</strong> (e.g. 501, 502, etc.).
            </span>
          </div>
        </div>

        {/* Lockout Warning State */}
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
              🔒 Login Locked for 15 Minutes
            </h3>
            <p className="text-xs text-red-600 mt-1">
              Too many incorrect password attempts (3/3). Please wait for the security countdown to finish.
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
          <div>
            {/* Password Input Box */}
            <form onSubmit={handleSubmit} className="mb-4">
              <div className="relative">
                <input
                  ref={inputRef}
                  id="student-password-input"
                  type={showPassword ? 'text' : 'password'}
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    setError(null);
                  }}
                  placeholder="Enter your password"
                  className="w-full text-center text-2xl font-mono font-black tracking-wider py-3.5 px-12 bg-slate-50 border-2 border-blue-300 focus:border-blue-600 rounded-2xl shadow-inner focus:outline-none transition-all text-slate-900 placeholder:text-slate-300 placeholder:text-base placeholder:font-sans placeholder:font-normal"
                />

                {/* Show/Hide Toggle */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>

                {passwordInput.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-500 hover:text-slate-800 bg-slate-200/80 hover:bg-slate-300 px-2 py-1 rounded-md transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Error Message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mt-2.5 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-xs text-red-700 font-medium"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
                    <div className="flex-1">
                      <span>{error}</span>
                      <span className="block mt-1 text-[11px] text-red-600/90">
                        Ask <strong>Smriti Ma'am</strong> at school if you forgot your password!
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Attempts counter notice */}
              <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 px-1 font-medium">
                <span className="flex items-center gap-1">
                  <Key className="w-3.5 h-3.5 text-blue-500" />
                  Type using keyboard or keypad below
                </span>
                <span className="font-semibold text-amber-600">
                  Attempts left: {attemptsLeft}/3
                </span>
              </div>
            </form>

            {/* Tactile Keypad for Digits */}
            <div className="grid grid-cols-3 gap-2 mb-4 select-none">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
                <motion.button
                  key={digit}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleKeyPress(digit.toString())}
                  className="h-11 sm:h-12 bg-slate-100 hover:bg-slate-200 active:bg-blue-100 active:text-blue-700 text-slate-800 text-lg font-bold rounded-2xl shadow-xs border border-slate-200/80 flex items-center justify-center transition-colors cursor-pointer"
                >
                  {digit}
                </motion.button>
              ))}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleClear}
                className="h-11 sm:h-12 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-2xl border border-slate-200/80 flex items-center justify-center cursor-pointer"
              >
                Clear
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => handleKeyPress('0')}
                className="h-11 sm:h-12 bg-slate-100 hover:bg-slate-200 active:bg-blue-100 active:text-blue-700 text-slate-800 text-lg font-bold rounded-2xl shadow-xs border border-slate-200/80 flex items-center justify-center transition-colors cursor-pointer"
              >
                0
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleBackspace}
                className="h-11 sm:h-12 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-2xl border border-slate-200/80 flex items-center justify-center cursor-pointer"
              >
                ⌫
              </motion.button>
            </div>

            {/* Login Submit Button */}
            <motion.button
              id="student-login-submit-btn"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSubmit()}
              disabled={loading || !passwordInput.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-3.5 px-4 rounded-2xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 text-base transition-all cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Log In to Student Portal</span>
                  <Sparkles className="w-4 h-4 text-yellow-300" />
                </>
              )}
            </motion.button>

            {/* Forgot password / Change password helper */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col items-center justify-center gap-1.5 text-center">
              <p className="text-[11px] text-slate-500 flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>Forgot your password? Ask <strong>Smriti Ma'am</strong> at school!</span>
              </p>
              {onOpenChangePassword && (
                <button
                  type="button"
                  onClick={onOpenChangePassword}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                >
                  Change your Student Password →
                </button>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
