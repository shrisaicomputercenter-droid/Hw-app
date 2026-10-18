import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, PartyPopper, Heart } from 'lucide-react';

interface BirthdayBannerProps {
  studentName: string;
}

export const BirthdayBanner: React.FC<BirthdayBannerProps> = ({ studentName }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="w-full bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 text-white rounded-3xl p-5 sm:p-6 shadow-xl shadow-rose-500/20 border-2 border-white/60 mb-6 relative overflow-hidden"
    >
      {/* Decorative background balloons */}
      <div className="absolute top-2 right-4 text-3xl opacity-40 select-none animate-bounce">
        🎈
      </div>
      <div className="absolute bottom-2 right-12 text-2xl opacity-40 select-none animate-pulse">
        ✨
      </div>

      <div className="flex items-start space-x-3.5 relative z-10">
        <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-3xl shrink-0 shadow-inner border border-white/40">
          🎂
        </div>

        <div className="flex-1">
          <div className="inline-flex items-center gap-1 bg-white/25 backdrop-blur-sm text-yellow-200 text-xs font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider mb-1">
            <PartyPopper className="w-3.5 h-3.5" />
            <span>Special Day Today!</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white leading-snug drop-shadow-sm">
            🎂 Happy Birthday to you, {studentName}! 🎉
          </h2>

          <p className="text-sm text-pink-100 font-medium mt-1 flex items-center gap-1.5">
            <Heart className="w-4 h-4 text-yellow-300 fill-yellow-300 inline" />
            Wishing you a wonderful birthday! Have a fantastic year in Class 5!
          </p>
        </div>
      </div>
    </motion.div>
  );
};
