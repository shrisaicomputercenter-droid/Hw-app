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
  RefreshCw,
  Send,
  Users,
  AlertCircle,
  Eye,
  ArrowLeft,
  CalendarDays,
  CheckSquare,
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
import { getValidSchoolDates, isSundayOrSecondSaturday } from '../lib/dateUtils';
import { api } from '../lib/api';
import { PdfViewerModal } from './PdfViewerModal';
import { ImageViewerModal } from './ImageViewerModal';

interface HomeworkHistoryPageProps {
  session: UserSession | null;
  onBack?: () => void;
  onViewPdf?: (pdf: PdfDocument) => void;
  onNavigateToPasteHW?: (category?: StudentCategory | 'all') => void;
  onNavigateToHub?: () => void;
  onNavigateToAnnouncements?: () => void;
  onNavigateToCalendar?: () => void;
  isInlineFullPage?: boolean;
}

export const HomeworkHistoryPage: React.FC<HomeworkHistoryPageProps> = ({
  session,
  onBack,
  onViewPdf,
  onNavigateToPasteHW,
  onNavigateToHub,
  onNavigateToAnnouncements,
  onNavigateToCalendar,
  isInlineFullPage,
}) => {
  const isStudent = session?.role === 'student';
  const isTeacher = session?.role === 'teacher';
  const studentRoll = session?.student?.rollNo;

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

  // Modals for attached files
  const [viewingPdf, setViewingPdf] = useState<PdfDocument | null>(null);
  const [viewingImage, setViewingImage] = useState<PdfDocument | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [hwRes, compRes, catRes] = await Promise.all([
        api.getHomeworkHistory(),
        api.getCompletionHistory(isStudent ? { rollNo: studentRoll } : undefined),
        isTeacher ? api.getStudentCategories() : Promise.resolve({ success: true, categories: {} }),
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
      // Subject filter
      if (selectedSubject !== 'all' && item.subject !== selectedSubject) {
        return false;
      }
      // Date filter
      if (selectedDate !== 'all' && item.assignedDate !== selectedDate) {
        return false;
      }
      // Category filter - ONLY FOR TEACHERS
      if (isTeacher && selectedCategory !== 'all') {
        if (selectedCategory === 'common' && item.category && item.category !== 'all') {
          return false;
        }
        if (selectedCategory !== 'common' && item.category !== selectedCategory) {
          return false;
        }
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchContent = item.content.toLowerCase().includes(q);
        const matchSubject = item.subjectName.toLowerCase().includes(q);
        const matchTeacher = item.teacherName.toLowerCase().includes(q);
        if (!matchContent && !matchSubject && !matchTeacher) {
          return false;
        }
      }
      return true;
    });
  }, [homeworkHistory, selectedSubject, selectedDate, selectedCategory, searchQuery, isTeacher]);

  // Filtered Completion History
  const filteredCompletionHistory = useMemo(() => {
    return completionHistory.filter((item) => {
      if (selectedSubject !== 'all' && item.subject !== selectedSubject) {
        return false;
      }
      if (selectedDate !== 'all' && item.date !== selectedDate) {
        return false;
      }
      // Category filter - ONLY FOR TEACHERS
      if (isTeacher && selectedCategory !== 'all') {
        const studentCat = studentCategories[item.rollNo];
        if (studentCat !== selectedCategory) {
          return false;
        }
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchStudent = item.studentName.toLowerCase().includes(q);
        const matchRoll = item.rollNo.toString().includes(q);
        const matchSubject = item.subjectName.toLowerCase().includes(q);
        if (!matchStudent && !matchRoll && !matchSubject) {
          return false;
        }
      }
      return true;
    });
  }, [completionHistory, selectedSubject, selectedDate, selectedCategory, searchQuery, studentCategories, isTeacher]);

  // Handle teacher deleting a homework history record
  const handleDeleteHistory = async (id: string) => {
    if (!isTeacher) return;
    if (!confirm('Are you sure you want to remove this record from past homework history?')) {
      return;
    }
    setDeletingId(id);
    try {
      const res = await api.deleteHomeworkHistory(id);
      if (res.success) {
        setHomeworkHistory((prev) => prev.filter((item) => item.id !== id));
      } else {
        alert(res.error || 'Failed to delete record.');
      }
    } catch (e: any) {
      alert(e?.message || 'Error deleting record.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleOpenFile = (file: PdfDocument) => {
    const isImg = file.fileType === 'image' || /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(file.fileName);
    if (isImg) {
      setViewingImage(file);
    } else {
      setViewingPdf(file);
    }
    if (onViewPdf) {
      onViewPdf(file);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6">
      {/* Top Header Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        {(onBack || onNavigateToHub) && (
          <button
            onClick={onBack || onNavigateToHub}
            className="self-start inline-flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-blue-700 bg-white hover:bg-slate-100 px-3.5 py-2 rounded-xl border border-slate-200 shadow-xs transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to {session ? 'Dashboard' : 'Hub'}</span>
          </button>
        )}

        <div className="flex items-center gap-2 self-end sm:self-center">
          {onNavigateToCalendar && (
            <button
              onClick={onNavigateToCalendar}
              className="text-xs font-bold text-purple-800 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
            >
              📅 Holiday Calendar
            </button>
          )}
          {onNavigateToAnnouncements && (
            <button
              onClick={onNavigateToAnnouncements}
              className="text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
            >
              📢 Announcements
            </button>
          )}
        </div>
      </div>

      {/* Hero Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-950/20 border border-slate-800 mb-6 relative overflow-hidden"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-black uppercase tracking-wider text-blue-200 bg-blue-800/80 px-3 py-0.5 rounded-full border border-blue-600/50">
                PM SHRI Kendriya Vidyalaya Mandla
              </span>
              <span className="text-xs font-bold text-slate-300">Class 5 Timeline</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black flex items-center gap-2.5">
              <span>📅 Complete Homework History</span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl font-medium">
              View all daily homework assignments and completion records organized latest to oldest. (Sundays & 2nd Saturdays excluded).
            </p>
          </div>

          <button
            onClick={loadData}
            title="Refresh History"
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 active:scale-95 text-white text-xs font-bold py-2.5 px-4 rounded-xl border border-white/20 transition-all cursor-pointer self-start sm:self-auto shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh History</span>
          </button>
        </div>

        {/* View Mode Tabs */}
        <div className="flex items-center gap-2 mt-6 pt-5 border-t border-white/10 overflow-x-auto">
          <button
            onClick={() => setActiveTab('sent')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'sent'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white/10 text-slate-200 hover:bg-white/20'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Assigned Homework History ({filteredHomeworkHistory.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('completions')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'completions'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white/10 text-slate-200 hover:bg-white/20'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>{isStudent ? 'My Completed Assignments' : 'Student Completions Timeline'} ({filteredCompletionHistory.length})</span>
          </button>
        </div>
      </motion.div>

      {/* Filter Bar */}
      <div className="bg-white rounded-3xl p-5 shadow-xl shadow-slate-200/70 border border-slate-100 mb-6 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Subject Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                Subject:
              </span>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="all">All 4 Subjects</option>
                <option value="english">🔤 English</option>
                <option value="twau">🌍 TWAU</option>
                <option value="maths">📐 Maths</option>
                <option value="hindi">🇮🇳 Hindi</option>
              </select>
            </div>

            {/* Date Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                Date:
              </span>
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 cursor-pointer max-w-[180px] truncate"
              >
                <option value="all">All Dates</option>
                {validDatesList.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Filter - SHOWN ONLY TO TEACHERS! Students NEVER see categories */}
            {isTeacher && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                  Category:
                </span>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-purple-50 border border-purple-200 text-purple-900 text-xs font-bold rounded-xl px-3 py-2 focus:ring-2 focus:ring-purple-500 cursor-pointer"
                >
                  <option value="all">All Levels</option>
                  <option value="common">General / Common</option>
                  <option value="beginner">🌱 Beginner</option>
                  <option value="progressive">📈 Progressive</option>
                  <option value="proficient">⭐ Proficient</option>
                </select>
              </div>
            )}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isStudent ? 'Search homework...' : 'Search homework or student...'}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="bg-white rounded-3xl p-12 text-center shadow-md border border-slate-100">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500 font-bold">Loading records...</p>
        </div>
      ) : activeTab === 'sent' ? (
        /* TAB 1: Assigned Homework History */
        <div className="space-y-4">
          {filteredHomeworkHistory.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center shadow-md border border-slate-100">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-3xl mx-auto mb-3">
                📅
              </div>
              <h3 className="text-lg font-black text-slate-800">No Past Homework Found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                No past homework matching your selected filters was found. Teachers assign homework every school day.
              </p>
            </div>
          ) : (
            filteredHomeworkHistory.map((item) => {
              const cfg = SUBJECTS_CONFIG[item.subject];
              const dateObj = new Date(item.createdAt || item.assignedDate);
              const timeString = isNaN(dateObj.getTime())
                ? ''
                : dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-3xl p-5 sm:p-6 shadow-md border border-slate-100 transition-all hover:shadow-lg"
                >
                  {/* Top Bar: Subject, Date, Delete (Teacher only) */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-100">
                    <div className="flex items-center flex-wrap gap-2">
                      <span className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-base shadow-inner">
                        {cfg?.flag || '📚'}
                      </span>
                      <div>
                        <span className="font-extrabold text-sm sm:text-base text-slate-900 block leading-tight">
                          {item.subjectName}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">
                          Faculty: {item.teacherName}
                        </span>
                      </div>

                      {/* Category Badge - SHOWN ONLY TO TEACHERS */}
                      {isTeacher && item.category && item.category !== 'all' && (
                        <span
                          className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border shadow-xs ml-1 ${
                            STUDENT_CATEGORIES[item.category]?.badgeColor ||
                            'bg-purple-100 text-purple-800 border-purple-200'
                          }`}
                        >
                          {STUDENT_CATEGORIES[item.category]?.label || item.category}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <div className="text-right">
                        <span className="font-black text-xs text-blue-900 bg-blue-50 px-3 py-1 rounded-xl border border-blue-200 inline-flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-blue-600" />
                          <span>{item.assignedDate}</span>
                        </span>
                        {timeString && (
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            {timeString}
                          </span>
                        )}
                      </div>

                      {isTeacher && (
                        <button
                          disabled={deletingId === item.id}
                          onClick={() => handleDeleteHistory(item.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer ml-1"
                          title="Delete past homework record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Homework Text Content */}
                  <div className="mt-3.5 bg-slate-50/70 p-4 rounded-2xl border border-slate-200/70 text-sm sm:text-base text-slate-800 font-normal whitespace-pre-wrap leading-relaxed">
                    {item.content || <span className="italic text-slate-400">No text description recorded.</span>}
                  </div>

                  {/* Attached Worksheets/Images */}
                  {item.attachments && item.attachments.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                        Attached Files ({item.attachments.length}):
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {item.attachments.map((file) => (
                          <div
                            key={file.id}
                            className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-between gap-2 text-xs"
                          >
                            <span className="font-bold text-slate-800 truncate">{file.title || file.fileName}</span>
                            <button
                              onClick={() => handleOpenFile(file)}
                              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-[11px] shrink-0 cursor-pointer"
                            >
                              View File
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Teacher Completion Stats */}
                  {isTeacher && item.completionStats && (
                    <div className="mt-3 pt-2.5 flex items-center justify-between text-xs text-slate-500 font-medium">
                      <span>Total Students: {item.completionStats.totalStudents || 41}</span>
                      <span className="text-emerald-700 font-bold">
                        Completed: {item.completionStats.doneStudents || 0} / {item.completionStats.totalStudents || 41}
                      </span>
                    </div>
                  )}
                </motion.div>
              );
            })
          )}
        </div>
      ) : (
        /* TAB 2: Completion Records */
        <div className="space-y-4">
          {filteredCompletionHistory.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center shadow-md border border-slate-100">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-3xl mx-auto mb-3">
                ✅
              </div>
              <h3 className="text-lg font-black text-slate-800">No Completion Records Found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                No completions matching the filters. When homework is completed, timestamps appear here.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl shadow-md border border-slate-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-black uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4 w-16 text-center">Roll</th>
                      <th className="py-3 px-4">Student</th>
                      <th className="py-3 px-4">Subject</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {filteredCompletionHistory.map((item) => {
                      const cfg = SUBJECTS_CONFIG[item.subject];
                      const dateObj = new Date(item.timestamp);
                      const timeString = isNaN(dateObj.getTime())
                        ? ''
                        : dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4 text-center font-black text-slate-900">{item.rollNo}</td>
                          <td className="py-3 px-4 font-bold text-slate-900">{item.studentName}</td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center gap-1 font-bold">
                              <span>{cfg?.flag}</span>
                              <span>{item.subjectName}</span>
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-blue-900">{item.date}</td>
                          <td className="py-3 px-4">
                            {item.completed ? (
                              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold border border-emerald-200">
                                Completed ✓
                              </span>
                            ) : (
                              <span className="text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full font-bold">
                                Pending
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">{timeString}</td>
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

      {/* PDF Viewer Modal */}
      {viewingPdf && (
        <PdfViewerModal
          file={viewingPdf}
          onClose={() => setViewingPdf(null)}
        />
      )}

      {/* Image Viewer Modal */}
      {viewingImage && (
        <ImageViewerModal
          file={viewingImage}
          onClose={() => setViewingImage(null)}
        />
      )}
    </div>
  );
};
