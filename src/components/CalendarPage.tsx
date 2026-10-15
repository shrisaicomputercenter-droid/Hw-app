import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Sun,
  School,
  Sparkles,
  Info,
  ArrowLeft,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { isSundayOrSecondSaturday, formatSchoolDate } from '../lib/dateUtils';

interface CalendarPageProps {
  onBack: () => void;
  onNavigateToHomework?: () => void;
  onNavigateToAnnouncements?: () => void;
}

interface HolidayEvent {
  date: string; // YYYY-MM-DD
  title: string;
  type: 'national' | 'festival' | 'vacation' | 'weekly';
  description: string;
}

// Major school holidays for Kendriya Vidyalaya (Academic Session 2025-2026 / 2026-2027)
const SCHOOL_HOLIDAYS_LIST: HolidayEvent[] = [
  { date: '2026-01-26', title: 'Republic Day', type: 'national', description: 'National Holiday & Flag Hoisting' },
  { date: '2026-02-15', title: 'Maha Shivratri', type: 'festival', description: 'Gazetted Holiday' },
  { date: '2026-03-03', title: 'Holi Break', type: 'festival', description: 'Festival of Colours' },
  { date: '2026-03-21', title: 'Id-ul-Fitr (Eid)', type: 'festival', description: 'Gazetted Holiday' },
  { date: '2026-04-03', title: 'Good Friday', type: 'festival', description: 'Gazetted Holiday' },
  { date: '2026-04-14', title: 'Dr. B.R. Ambedkar Jayanti', type: 'national', description: 'National Observance' },
  { date: '2026-05-01', title: 'Summer Vacation Begins', type: 'vacation', description: 'Annual Summer Break for Primary Section' },
  { date: '2026-08-15', title: 'Independence Day', type: 'national', description: 'National Holiday' },
  { date: '2026-08-28', title: 'Raksha Bandhan', type: 'festival', description: 'School Holiday' },
  { date: '2026-09-04', title: 'Janmashtami', type: 'festival', description: 'Gazetted Holiday' },
  { date: '2026-09-24', title: 'Milad-un-Nabi', type: 'festival', description: 'Gazetted Holiday' },
  { date: '2026-10-02', title: 'Mahatma Gandhi Jayanti', type: 'national', description: 'National Holiday' },
  { date: '2026-10-18', title: 'Autumn Break / Dussehra Break', type: 'vacation', description: 'Kendriya Vidyalaya Autumn Vacation' },
  { date: '2026-10-19', title: 'Dussehra (Vijay Dashami)', type: 'festival', description: 'Gazetted Holiday' },
  { date: '2026-10-20', title: 'Autumn Break', type: 'vacation', description: 'Autumn Vacation Continues' },
  { date: '2026-11-08', title: 'Diwali (Deepawali)', type: 'festival', description: 'Festival of Lights' },
  { date: '2026-11-09', title: 'Govardhan Puja', type: 'festival', description: 'School Holiday' },
  { date: '2026-11-10', title: 'Bhai Dooj', type: 'festival', description: 'School Holiday' },
  { date: '2026-11-24', title: 'Guru Nanak Jayanti', type: 'festival', description: 'Gazetted Holiday' },
  { date: '2026-12-24', title: 'Winter Break Begins', type: 'vacation', description: 'Winter Vacation for Students' },
  { date: '2026-12-25', title: 'Christmas Day', type: 'festival', description: 'Gazetted Holiday' },
  { date: '2026-12-31', title: 'Winter Break', type: 'vacation', description: 'Winter Vacation for Students' },
  { date: '2027-01-01', title: 'New Year Day', type: 'vacation', description: 'Winter Break Continues' },
];

export const CalendarPage: React.FC<CalendarPageProps> = ({
  onBack,
  onNavigateToHomework,
  onNavigateToAnnouncements,
}) => {
  const today = new Date();
  const [currentDate, setCurrentDate] = useState<Date>(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDayDate, setSelectedDayDate] = useState<Date>(today);

  // Month navigation
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  // Days in month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayWeekday = new Date(currentYear, currentMonth, 1).getDay(); // 0 is Sunday

  // Month name
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Check if a specific date is a holiday
  const getHolidayForDate = (date: Date): { isHoliday: boolean; reason: string; type?: string } => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;

    // 1. Check fixed list
    const found = SCHOOL_HOLIDAYS_LIST.find((h) => h.date === dateStr);
    if (found) {
      return { isHoliday: true, reason: found.title, type: found.type };
    }

    // 2. Check Sundays
    if (date.getDay() === 0) {
      return { isHoliday: true, reason: 'Sunday (Weekly Holiday)', type: 'weekly' };
    }

    // 3. Check Second Saturday
    if (date.getDay() === 6) {
      const dayOfMonth = date.getDate();
      if (dayOfMonth >= 8 && dayOfMonth <= 14) {
        return { isHoliday: true, reason: 'Second Saturday (KV Holiday)', type: 'weekly' };
      }
    }

    return { isHoliday: false, reason: 'Regular School Day' };
  };

  // Today's status
  const todayHolidayInfo = getHolidayForDate(today);

  // Selected date info
  const selectedInfo = getHolidayForDate(selectedDayDate);

  // Generate calendar days
  const calendarCells = [];
  // Empty padding cells before 1st of month
  for (let i = 0; i < firstDayWeekday; i++) {
    calendarCells.push(null);
  }
  // Days 1 through daysInMonth
  for (let d = 1; d <= daysInMonth; d++) {
    calendarCells.push(new Date(currentYear, currentMonth, d));
  }

  // Upcoming holidays from today
  const upcomingHolidays = SCHOOL_HOLIDAYS_LIST.filter((h) => {
    const hDate = new Date(h.date);
    return hDate >= new Date(today.getFullYear(), today.getMonth(), today.getDate());
  }).slice(0, 8);

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <button
          onClick={onBack}
          className="self-start inline-flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-blue-700 bg-white hover:bg-slate-100 px-3.5 py-2 rounded-xl border border-slate-200 shadow-xs transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Hub</span>
        </button>

        <div className="flex items-center gap-2 self-end sm:self-center">
          {onNavigateToAnnouncements && (
            <button
              onClick={onNavigateToAnnouncements}
              className="text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
            >
              📢 View Announcements
            </button>
          )}
          {onNavigateToHomework && (
            <button
              onClick={onNavigateToHomework}
              className="text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
            >
              🎒 Go to Homework
            </button>
          )}
        </div>
      </div>

      {/* Hero Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-blue-950/20 border border-blue-800/40 mb-6 relative overflow-hidden"
      >
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-black uppercase tracking-wider text-blue-200 bg-blue-800/80 px-3 py-0.5 rounded-full border border-blue-600/50">
              PM SHRI Kendriya Vidyalaya Mandla
            </span>
            <span className="text-xs font-bold text-blue-300">Session 2025–2026</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black flex items-center gap-2.5">
            <span>📅 School Holiday Calendar</span>
          </h1>

          <p className="text-xs sm:text-sm text-blue-100/90 mt-1 max-w-2xl font-medium">
            Check official KV holidays, Sundays, 2nd Saturdays, and festival vacations. More custom school dates can be added anytime.
          </p>

          {/* Today's Status Pill */}
          <div className="mt-4 inline-flex items-center gap-2 p-2.5 px-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
            <span className="text-base select-none">
              {todayHolidayInfo.isHoliday ? '🏖️' : '🏫'}
            </span>
            <span className="text-xs font-bold text-white">
              Today ({today.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}):
            </span>
            <span
              className={`text-xs font-black px-2.5 py-0.5 rounded-full ${
                todayHolidayInfo.isHoliday
                  ? 'bg-rose-500/90 text-white'
                  : 'bg-emerald-500/90 text-white'
              }`}
            >
              {todayHolidayInfo.isHoliday ? `Holiday • ${todayHolidayInfo.reason}` : 'School is Open Today'}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Main Grid: Calendar on Left, Selected Date & Upcoming on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Interactive Month Calendar */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-5 sm:p-7 shadow-xl shadow-slate-200/70 border border-slate-100">
          {/* Month Header & Controls */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">{monthName}</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Click any date to see if school is open or holiday
              </p>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200">
              <button
                onClick={prevMonth}
                title="Previous Month"
                className="p-2 text-slate-600 hover:text-slate-950 hover:bg-white rounded-xl transition-all cursor-pointer shadow-xs active:scale-95"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1))}
                className="px-2.5 py-1 text-xs font-black text-blue-700 hover:bg-white rounded-xl transition-all cursor-pointer"
              >
                Today
              </button>
              <button
                onClick={nextMonth}
                title="Next Month"
                className="p-2 text-slate-600 hover:text-slate-950 hover:bg-white rounded-xl transition-all cursor-pointer shadow-xs active:scale-95"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weekday Labels */}
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-black uppercase tracking-wider mb-2">
            <span className="text-rose-600 py-1">Sun</span>
            <span className="text-slate-600 py-1">Mon</span>
            <span className="text-slate-600 py-1">Tue</span>
            <span className="text-slate-600 py-1">Wed</span>
            <span className="text-slate-600 py-1">Thu</span>
            <span className="text-slate-600 py-1">Fri</span>
            <span className="text-amber-600 py-1">Sat</span>
          </div>

          {/* Calendar Day Grid */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {calendarCells.map((date, idx) => {
              if (!date) {
                return <div key={`empty-${idx}`} className="h-14 sm:h-16 rounded-2xl bg-slate-50/50" />;
              }

              const holidayInfo = getHolidayForDate(date);
              const isSelected =
                selectedDayDate.getFullYear() === date.getFullYear() &&
                selectedDayDate.getMonth() === date.getMonth() &&
                selectedDayDate.getDate() === date.getDate();
              const isToday =
                today.getFullYear() === date.getFullYear() &&
                today.getMonth() === date.getMonth() &&
                today.getDate() === date.getDate();

              let cellBg = 'bg-white hover:bg-slate-50 border-slate-200/90 text-slate-800';
              if (holidayInfo.isHoliday) {
                if (holidayInfo.type === 'festival' || holidayInfo.type === 'vacation') {
                  cellBg = 'bg-purple-50/90 hover:bg-purple-100/90 border-purple-200 text-purple-950';
                } else if (date.getDay() === 0) {
                  cellBg = 'bg-rose-50/80 hover:bg-rose-100/80 border-rose-200 text-rose-950';
                } else {
                  cellBg = 'bg-amber-50/80 hover:bg-amber-100/80 border-amber-200 text-amber-950';
                }
              }

              return (
                <button
                  key={date.toISOString()}
                  onClick={() => setSelectedDayDate(date)}
                  className={`h-14 sm:h-16 p-1.5 rounded-2xl border transition-all text-left flex flex-col justify-between cursor-pointer relative ${cellBg} ${
                    isSelected ? 'ring-3 ring-blue-600 shadow-md scale-102 z-10' : ''
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`text-xs font-black ${
                        isToday
                          ? 'w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center'
                          : holidayInfo.isHoliday && date.getDay() === 0
                          ? 'text-rose-600 font-extrabold'
                          : 'text-slate-900'
                      }`}
                    >
                      {date.getDate()}
                    </span>

                    {holidayInfo.isHoliday && (
                      <span className="text-[10px]" title={holidayInfo.reason}>
                        {holidayInfo.type === 'festival' ? '🎉' : holidayInfo.type === 'vacation' ? '🏖️' : '🛑'}
                      </span>
                    )}
                  </div>

                  <span className="text-[9px] font-bold leading-tight truncate w-full opacity-80">
                    {holidayInfo.isHoliday ? holidayInfo.reason : 'School'}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Calendar Legend */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-3 text-xs">
            <span className="font-extrabold text-slate-500 uppercase tracking-wider">Legend:</span>
            <span className="flex items-center gap-1 font-bold text-slate-700">
              <span className="w-3 h-3 rounded-full bg-white border border-slate-300" />
              School Day
            </span>
            <span className="flex items-center gap-1 font-bold text-rose-700">
              <span className="w-3 h-3 rounded-full bg-rose-200 border border-rose-400" />
              Sunday (Holiday)
            </span>
            <span className="flex items-center gap-1 font-bold text-amber-700">
              <span className="w-3 h-3 rounded-full bg-amber-200 border border-amber-400" />
              2nd Saturday (KV Holiday)
            </span>
            <span className="flex items-center gap-1 font-bold text-purple-700">
              <span className="w-3 h-3 rounded-full bg-purple-200 border border-purple-400" />
              Festivals & Vacations
            </span>
          </div>
        </div>

        {/* Right Column: Selected Date Details & Upcoming Holidays */}
        <div className="space-y-6">
          {/* Selected Date Card */}
          <div className="bg-white rounded-3xl p-6 shadow-xl shadow-slate-200/70 border border-slate-100">
            <span className="text-xs font-black uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
              Selected Date
            </span>

            <h3 className="text-xl font-black text-slate-900 mt-2">
              {selectedDayDate.toLocaleDateString('en-GB', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </h3>

            <div
              className={`mt-4 p-4 rounded-2xl border ${
                selectedInfo.isHoliday
                  ? 'bg-rose-50 border-rose-200 text-rose-950'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-950'
              }`}
            >
              <div className="flex items-center gap-2 font-black text-sm">
                <span>{selectedInfo.isHoliday ? '🛑 School Holiday' : '🟢 Regular School Working Day'}</span>
              </div>
              <p className="text-xs font-medium mt-1">
                {selectedInfo.reason}
              </p>
            </div>

            <p className="text-xs text-slate-500 mt-3 font-medium">
              Daily Class 5 homework is assigned every working school day. No homework on Sundays or 2nd Saturdays.
            </p>
          </div>

          {/* Upcoming School Holidays */}
          <div className="bg-white rounded-3xl p-6 shadow-xl shadow-slate-200/70 border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Sun className="w-4 h-4 text-amber-500" />
                <span>Upcoming Holidays</span>
              </h4>
              <span className="text-xs font-bold text-slate-400">{upcomingHolidays.length} upcoming</span>
            </div>

            <div className="space-y-2.5">
              {upcomingHolidays.map((h) => {
                const dateObj = new Date(h.date);
                const display = dateObj.toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  weekday: 'short',
                });

                return (
                  <div
                    key={h.date}
                    className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-200/70 flex items-center justify-between gap-2 transition-colors text-xs"
                  >
                    <div>
                      <span className="font-black text-slate-900 block">{h.title}</span>
                      <span className="text-[11px] text-slate-500 font-medium">{h.description}</span>
                    </div>
                    <span className="font-mono font-bold text-[11px] text-blue-700 bg-blue-50 px-2 py-1 rounded-lg border border-blue-200 shrink-0">
                      {display}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Note for User */}
            <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600">
              <span className="font-bold text-slate-800">Notice: </span>
              Official calendar for PM SHRI Kendriya Vidyalaya Mandla. Further academic dates and custom holidays will be updated as provided.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
