import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  BookOpen,
  Filter,
  Search,
  FileText,
  Trash2,
  History,
  Sparkles,
  User,
  CalendarDays,
  RefreshCw,
  Send,
  Users,
  AlertCircle,
  Eye,
  Award,
  Layers,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import {
  HomeworkHistoryItem,
  CompletionHistoryItem,
  SubjectKey,
  UserSession,
  PdfDocument,
  StudentCategory,
} from '../types';
import { SUBJECTS_CONFIG, STUDENT_CATEGORIES, CATEGORY_ORDER } from '../studentData';
import { getValidSchoolDates, isSundayOrSecondSaturday, getTodaySchoolDate } from '../lib/dateUtils';
import { api } from '../lib/api';

interface HomeworkHistoryPageProps {
  session: UserSession;
  onViewPdf?: (pdf: PdfDocument) => void;
  onNavigateToPasteHW?: (category?: StudentCategory | 'all') => void;
  isInlineFullPage?: boolean;
}

export const HomeworkHistoryPage: React.FC<HomeworkHistoryPageProps> = ({
  session,
  onViewPdf,
  onNavigateToPasteHW,
  isInlineFullPage = true,
}) => {
  const isStudent = session.role === 'student';
  const isTeacher = session.role === 'teacher';
  const studentRoll = session.student?.rollNo;

  // Active view: 'sent' (Homework sent by date) vs 'completions' (Completions done by date)
  const [activeTab, setActiveTab] = useState<'sent' | 'completions'>('sent');

  // Filters
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Data
  const [homeworkHistory, setHomeworkHistory] = useState<HomeworkHistoryItem[]>([]);
  const [completionHistory, setCompletionHistory] = useState<CompletionHistoryItem[]>([]);
  const [studentCategories, setStudentCategories] = useState<Record<number, StudentCategory>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [hwRes, compRes, catRes] = await Promise.all([
        api.getHomeworkHistory(),
        api.getCompletionHistory(isStudent ? { rollNo: studentRoll } : undefined),
        api.getStudentCategories(),
      ]);

      if (hwRes.history) {
        // Exclude Sundays and 2nd Saturdays & sort latest to oldest
        const cleanHw = hwRes.history
          .filter((h) => !isSundayOrSecondSaturday(h.assignedDate))
          .sort((a, b) => {
            const timeA = new Date(a.createdAt || a.assignedDate).getTime();
            const timeB = new Date(b.createdAt || b.assignedDate).getTime();
            return timeB - timeA;
          });
        setHomeworkHistory(cleanHw);
      }

      if (compRes.history) {
        const cleanComp = compRes.history
          .filter((c) => !isSundayOrSecondSaturday(c.date))
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setCompletionHistory(cleanComp);
      }

      if (catRes.categories) {
        setStudentCategories(catRes.categories);
      }
    } catch (e) {
      console.error('Failed to load homework history:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // School calendar valid dates starting from today (strictly excluding Sundays and 2nd Saturdays)
  const validDatesList = useMemo(() => {
    return getValidSchoolDates(25);
  }, []);

  // Filtered Homework Sent History (Sorted latest to oldest)
  const filteredHomeworkHistory = useMemo(() => {
    return homeworkHistory.filter((item) => {
      // Exclude Sundays and 2nd Saturdays
      if (isSundayOrSecondSaturday(item.assignedDate)) return false;

      if (selectedSubject !== 'all' && item.subject !== selectedSubject) {
        return false;
      }
      if (selectedDate !== 'all' && item.assignedDate !== selectedDate) {
        return false;
      }
      if (selectedCategory !== 'all') {
        const cat = item.category || 'all';
        if (cat !== selectedCategory && cat !== 'all') {
          return false;
        }
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesContent = item.content.toLowerCase().includes(query);
        const matchesSubject = item.subjectName.toLowerCase().includes(query);
        const matchesTeacher = item.teacherName.toLowerCase().includes(query);
        const matchesDate = item.assignedDate.toLowerCase().includes(query);
        const matchesCategory = item.category ? item.category.toLowerCase().includes(query) : false;
        if (!matchesContent && !matchesSubject && !matchesTeacher && !matchesDate && !matchesCategory) {
          return false;
        }
      }
      return true;
    });
  }, [homeworkHistory, selectedSubject, selectedDate, selectedCategory, searchQuery]);

  // Filtered Completion History (Sorted latest to oldest)
  const filteredCompletionHistory = useMemo(() => {
    return completionHistory.filter((item) => {
      // Exclude Sundays and 2nd Saturdays
      if (isSundayOrSecondSaturday(item.date)) return false;

      if (selectedSubject !== 'all' && item.subject !== selectedSubject) {
        return false;
      }
      if (selectedDate !== 'all' && item.date !== selectedDate) {
        return false;
      }
      if (selectedCategory !== 'all') {
        const cat = item.category || studentCategories[item.rollNo] || 'progressive';
        if (cat !== selectedCategory) {
          return false;
        }
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = item.studentName.toLowerCase().includes(query);
        const matchesRoll = item.rollNo.toString().includes(query);
        const matchesSubject = item.subjectName.toLowerCase().includes(query);
        const matchesDate = item.date.toLowerCase().includes(query);
        if (!matchesName && !matchesRoll && !matchesSubject && !matchesDate) {
          return false;
        }
      }
      return true;
    });
  }, [completionHistory, studentCategories, selectedSubject, selectedDate, selectedCategory, searchQuery]);

  // Handle deleting a homework history record (teacher only)
  const handleDeleteHistoryItem = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this homework record from history?')) {
      return;
    }
    setDeletingId(id);
    try {
      await api.deleteHomeworkHistory(id);
      setHomeworkHistory((prev) => prev.filter((h) => h.id !== id));
    } catch (err) {
      console.error('Failed to delete history record:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const todaySchoolDate = getTodaySchoolDate();

  return (
    <div className={`w-full ${isInlineFullPage ? 'space-y-6' : ''}`}>
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-blue-950/20 border border-blue-800/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-3xl shadow-inner shrink-0">
              📅
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-blue-200 bg-blue-800/90 px-3 py-0.5 rounded-full border border-blue-600/50">
                  Full Page History
                </span>
                <span className="text-xs font-bold text-blue-200">
                  Kendriya Vidyalaya Mandla • Class 5
                </span>
                <span className="text-xs font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2.5 py-0.5 rounded-full">
                  Today: {todaySchoolDate}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black mt-1">
                Homework Date-Wise History & Timeline
              </h1>
              <p className="text-sm text-blue-100/90 mt-1 max-w-2xl">
                Track on which date homework was assigned or completed across all 3 student categories
                (Beginner, Progressive, Proficient). Sundays and 2nd Saturdays are excluded.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
            <button
              onClick={loadData}
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-white/10 hover:bg-white/20 active:scale-95 text-white rounded-xl text-xs font-bold transition-all border border-white/15 cursor-pointer"
              title="Refresh timeline records"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            {isTeacher && onNavigateToPasteHW && (
              <button
                onClick={() => onNavigateToPasteHW('all')}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>+ Paste New HW</span>
              </button>
            )}
          </div>
        </div>

        {/* View Switcher Tabs (Sent HW vs Completions) */}
        <div className="flex items-center gap-3 mt-6 pt-5 border-t border-white/10">
          <button
            onClick={() => setActiveTab('sent')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === 'sent'
                ? 'bg-white text-blue-950 shadow-lg shadow-black/20'
                : 'bg-white/10 text-blue-100 hover:bg-white/15'
            }`}
          >
            <BookOpen className="w-4 h-4 text-blue-600" />
            <span>📤 Sent Homework by Date</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                activeTab === 'sent' ? 'bg-blue-100 text-blue-900' : 'bg-white/20 text-white'
              }`}
            >
              {filteredHomeworkHistory.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('completions')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === 'completions'
                ? 'bg-white text-blue-950 shadow-lg shadow-black/20'
                : 'bg-white/10 text-blue-100 hover:bg-white/15'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>✅ Student Completions Log</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                activeTab === 'completions'
                  ? 'bg-emerald-100 text-emerald-900'
                  : 'bg-white/20 text-white'
              }`}
            >
              {filteredCompletionHistory.length}
            </span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-xl shadow-slate-200/70 border border-slate-100 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-extrabold text-slate-500 uppercase tracking-wider">
            <Filter className="w-3.5 h-3.5 text-blue-600" />
            <span>Filter Timeline</span>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Showing latest to oldest • School holidays (Sundays & 2nd Saturdays) excluded
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* 1. Date Selector (Sundays & 2nd Saturdays excluded) */}
          <div>
            <label className="block text-xs font-black text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>Select Date</span>
            </label>
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="all">📅 All Working School Dates</option>
              {validDatesList.map((dt) => (
                <option key={dt} value={dt}>
                  {dt === todaySchoolDate ? `🌟 Today (${dt})` : dt}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Category Selector (Beginner / Progressive / Proficient) */}
          <div>
            <label className="block text-xs font-black text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-purple-600" />
              <span>Student Category</span>
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
            >
              <option value="all">👥 All Student Types</option>
              <option value="beginner">🌱 Beginner Level</option>
              <option value="progressive">📈 Progressive Level</option>
              <option value="proficient">⭐ Proficient Level</option>
            </select>
          </div>

          {/* 3. Subject Selector */}
          <div>
            <label className="block text-xs font-black text-slate-700 mb-1.5 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
              <span>Subject</span>
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="all">📚 All Subjects</option>
              {Object.values(SUBJECTS_CONFIG).map((s) => (
                <option key={s.key} value={s.key}>
                  {s.flag} {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* 4. Search Bar */}
          <div>
            <label className="block text-xs font-black text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-slate-500" />
              <span>Search Keywords</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Topic, chapter, student name..."
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-9 pr-3.5 py-2.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 text-xs font-black"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Quick Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider mr-1">
            Quick Types:
          </span>
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Types
          </button>
          {CATEGORY_ORDER.map((ck) => {
            const catInfo = STUDENT_CATEGORIES[ck];
            const isSelected = selectedCategory === ck;
            return (
              <button
                key={ck}
                onClick={() => setSelectedCategory(ck)}
                className={`px-3 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  isSelected
                    ? `${catInfo.badgeColor} ring-2 ring-blue-500/40 font-black`
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {catInfo.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB CONTENT: SENT HOMEWORK HISTORY */}
      {activeTab === 'sent' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <span>📤 Assigned Homework Timeline</span>
              <span className="text-xs bg-blue-100 text-blue-800 font-extrabold px-2.5 py-0.5 rounded-full">
                {filteredHomeworkHistory.length} Record{filteredHomeworkHistory.length === 1 ? '' : 's'}
              </span>
            </h2>
            <span className="text-xs text-slate-400 font-bold">Sorted Latest to Oldest ⬇</span>
          </div>

          {loading ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-md">
              <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-600">Loading homework history records...</p>
            </div>
          ) : filteredHomeworkHistory.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm space-y-3">
              <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center text-3xl mx-auto">
                📚
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-800">
                No Homework History Records Found
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                {searchQuery || selectedDate !== 'all' || selectedCategory !== 'all' || selectedSubject !== 'all'
                  ? 'No records matched your selected filters. Try changing or clearing filters above.'
                  : 'All inbuilt demo homework has been deleted. New homework assigned by teachers from today onwards will appear here.'}
              </p>
              {isTeacher && onNavigateToPasteHW && (
                <button
                  onClick={() => onNavigateToPasteHW('all')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black shadow-lg shadow-emerald-600/20 cursor-pointer mt-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Paste Homework for Today ({todaySchoolDate})</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredHomeworkHistory.map((item) => {
                const subConfig = SUBJECTS_CONFIG[item.subject];
                const catKey = (item.category || 'all') as StudentCategory | 'all';
                const catInfo = catKey !== 'all' ? STUDENT_CATEGORIES[catKey] : null;

                const totalStudents = item.completionStats?.totalStudents || 41;
                const doneStudents = item.completionStats?.doneStudents || 0;
                const percentage = totalStudents > 0 ? Math.round((doneStudents / totalStudents) * 100) : 0;

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-3xl p-6 sm:p-7 shadow-lg shadow-slate-200/60 border border-slate-100 hover:border-blue-200 transition-all space-y-4"
                  >
                    {/* Top Row: Date, Subject, Category Badge, and Teacher Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                      <div className="flex flex-wrap items-center gap-2.5">
                        {/* Assigned Date Badge */}
                        <div className="flex items-center gap-1.5 bg-blue-50 text-blue-800 border border-blue-200 px-3 py-1 rounded-xl text-xs font-extrabold">
                          <Calendar className="w-3.5 h-3.5 text-blue-600" />
                          <span>{item.assignedDate}</span>
                          {item.assignedDate === todaySchoolDate && (
                            <span className="bg-blue-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded-md uppercase">
                              Today
                            </span>
                          )}
                        </div>

                        {/* Subject Badge */}
                        <div className="flex items-center gap-1.5 bg-slate-100 text-slate-800 border border-slate-200 px-3 py-1 rounded-xl text-xs font-black">
                          <span>{subConfig?.flag || '📖'}</span>
                          <span>{item.subjectName}</span>
                        </div>

                        {/* Student Category Badge */}
                        {catInfo ? (
                          <div
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black border ${catInfo.badgeColor}`}
                          >
                            <span>{catInfo.label}</span>
                            <span className="text-[10px] font-bold opacity-80">(Targeted)</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black bg-slate-100 text-slate-700 border border-slate-200">
                            <Users className="w-3.5 h-3.5 text-slate-500" />
                            <span>👥 All Class 5 Students</span>
                          </div>
                        )}
                      </div>

                      {/* Teacher and Action */}
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-slate-500 hidden sm:inline">
                          Teacher: <strong className="text-slate-700">{item.teacherName}</strong>
                        </span>
                        {isTeacher && (
                          <button
                            onClick={(e) => handleDeleteHistoryItem(item.id, e)}
                            disabled={deletingId === item.id}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                            title="Delete this homework record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Content Body */}
                    <div className="text-sm text-slate-800 leading-relaxed font-medium whitespace-pre-wrap bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
                      {item.content || <span className="italic text-slate-400">No written text specified.</span>}
                    </div>

                    {/* Attachments (Worksheets, PDFs, Images) */}
                    {item.attachments && item.attachments.length > 0 && (
                      <div className="space-y-2 pt-1">
                        <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                          Worksheets & Attached Files ({item.attachments.length}):
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                          {item.attachments.map((file) => (
                            <div
                              key={file.id}
                              onClick={() => onViewPdf && onViewPdf(file)}
                              className="flex items-center justify-between p-3 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group"
                            >
                              <div className="flex items-center space-x-2.5 min-w-0">
                                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                  {file.fileType === 'image' ? '🖼️' : '📄'}
                                </div>
                                <div className="truncate">
                                  <p className="text-xs font-bold text-slate-800 truncate group-hover:text-blue-600">
                                    {file.title || file.fileName}
                                  </p>
                                  <span className="text-[10px] text-slate-400">
                                    {file.fileSizeBytes || 'File'}
                                  </span>
                                </div>
                              </div>
                              <Eye className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 shrink-0" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Completion Stats Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span className="text-xs font-bold text-slate-700">
                          Completion Rate:{' '}
                          <strong className="text-emerald-700">
                            {doneStudents} of {totalStudents} Students ({percentage}%)
                          </strong>
                        </span>
                      </div>

                      <div className="w-full sm:w-48 bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: STUDENT COMPLETIONS LOG */}
      {activeTab === 'completions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <span>✅ Verified Completion History</span>
              <span className="text-xs bg-emerald-100 text-emerald-800 font-extrabold px-2.5 py-0.5 rounded-full">
                {filteredCompletionHistory.length} Event{filteredCompletionHistory.length === 1 ? '' : 's'}
              </span>
            </h2>
            <span className="text-xs text-slate-400 font-bold">Sorted Latest to Oldest ⬇</span>
          </div>

          {loading ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-md">
              <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-600">Loading completion history log...</p>
            </div>
          ) : filteredCompletionHistory.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm space-y-3">
              <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-3xl mx-auto">
                ✅
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-800">
                No Completion Events Recorded
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                {searchQuery || selectedDate !== 'all' || selectedCategory !== 'all' || selectedSubject !== 'all'
                  ? 'No completion records match your selected filters.'
                  : 'Whenever students check off their homework or teachers verify it, completion history will be tracked here with date and time.'}
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/70 border border-slate-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-extrabold uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-3.5 px-4">Date & Time</th>
                      <th className="py-3.5 px-4">Roll No. & Student</th>
                      <th className="py-3.5 px-4">Student Category</th>
                      <th className="py-3.5 px-4">Subject</th>
                      <th className="py-3.5 px-4 text-center">Status</th>
                      <th className="py-3.5 px-4">Marked By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredCompletionHistory.map((item) => {
                      const subConfig = SUBJECTS_CONFIG[item.subject];
                      const catKey = (item.category || studentCategories[item.rollNo] || 'progressive') as StudentCategory;
                      const catInfo = STUDENT_CATEGORIES[catKey] || STUDENT_CATEGORIES.progressive;
                      const formattedTime = new Date(item.timestamp).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      });

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="font-bold text-slate-800">{item.date}</div>
                            <div className="text-[10px] text-slate-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>{formattedTime}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <span className="w-7 h-7 rounded-xl bg-blue-100 text-blue-900 font-black flex items-center justify-center text-xs shrink-0">
                                {item.rollNo}
                              </span>
                              <span className="font-bold text-slate-900">{item.studentName}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-black text-[11px] border ${catInfo.badgeColor}`}
                            >
                              <span>{catInfo.label}</span>
                            </span>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 font-bold text-slate-700">
                              <span>{subConfig?.flag || '📖'}</span>
                              <span>{item.subjectName}</span>
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            {item.completed ? (
                              <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-0.5 rounded-full font-black text-[11px]">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Completed</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full font-bold text-[11px]">
                                <XCircle className="w-3 h-3 text-slate-400" />
                                <span>Pending</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap text-slate-600 font-medium">
                            <span className="capitalize">{item.markedBy}</span>
                            {item.actorName && (
                              <span className="text-slate-400 text-[10px] block truncate max-w-[120px]">
                                ({item.actorName})
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
