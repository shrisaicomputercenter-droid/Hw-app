import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  MessageSquare,
  CheckCircle2,
  Circle,
  Clock,
  User,
  Sparkles,
  BookOpen,
  RefreshCw,
  FileText,
  Download,
  Eye,
  Paperclip,
  Image as ImageIcon,
  Calendar,
} from 'lucide-react';
import { Student, HomeworkMap, SubjectKey, PdfDocument, StudentCategory } from '../types';
import { SUBJECTS_CONFIG, SUBJECT_ORDER, isBirthdayToday } from '../studentData';
import { api } from '../lib/api';
import { BirthdayBanner } from './BirthdayBanner';
import { PdfViewerModal } from './PdfViewerModal';
import { ImageViewerModal } from './ImageViewerModal';
import { UserAvatar } from './UserAvatar';

interface StudentDashboardProps {
  student: Student;
  onOpenDoubts: () => void;
  onOpenProfile: () => void;
  onOpenChangeDp?: () => void;
  onOpenHistory: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  student,
  onOpenDoubts,
  onOpenProfile,
  onOpenChangeDp,
  onOpenHistory,
}) => {
  const activeTab: 'today' = 'today';
  const [currentCategory, setCurrentCategory] = useState<StudentCategory | undefined>(
    student.category
  );
  const [homework, setHomework] = useState<HomeworkMap | null>(null);
  const [allPdfFiles, setAllPdfFiles] = useState<PdfDocument[]>([]);
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<'all' | SubjectKey>('all');
  const [viewingPdf, setViewingPdf] = useState<PdfDocument | null>(null);
  const [viewingImage, setViewingImage] = useState<PdfDocument | null>(null);
  const [completions, setCompletions] = useState<{
    english: boolean;
    twau: boolean;
    maths: boolean;
    hindi: boolean;
  }>({
    english: false,
    twau: false,
    maths: false,
    hindi: false,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [updatingSubject, setUpdatingSubject] = useState<string | null>(null);
  const [unreadDoubtReplies, setUnreadDoubtReplies] = useState<number>(0);

  const isBirthday = isBirthdayToday(student.dob);

  const loadStudentData = async () => {
    try {
      const [hwData, compData, doubtData, pdfData, catData] = await Promise.all([
        api.getHomework({ rollNo: student.rollNo, category: currentCategory }),
        api.getStudentCompletion(student.rollNo),
        api.getDoubts(student.rollNo),
        api.getPdfFiles(),
        api.getStudentCategories(),
      ]);

      if (catData?.categories?.[student.rollNo]) {
        setCurrentCategory(catData.categories[student.rollNo]);
      }
      if (hwData) setHomework(hwData);
      if (pdfData?.files) setAllPdfFiles(pdfData.files);
      if (compData) {
        setCompletions({
          english: !!compData.english,
          twau: !!compData.twau,
          maths: !!compData.maths,
          hindi: !!compData.hindi,
        });
      }
      if (doubtData?.messages) {
        const unreadFromTeacher = doubtData.messages.filter(
          (m) => m.senderRole === 'teacher' && !m.readByStudent
        ).length;
        setUnreadDoubtReplies(unreadFromTeacher);
      }
    } catch (err) {
      console.error('Failed to load student data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudentData();
    // Periodic refresh every 10 seconds for real-time homework & chat updates
    const timer = setInterval(loadStudentData, 10000);
    return () => clearInterval(timer);
  }, [student.rollNo]);

  const handleToggleCompletion = async (subjectKey: SubjectKey) => {
    const currentVal = completions[subjectKey];
    const newVal = !currentVal;

    // Optimistic UI update
    setCompletions((prev) => ({
      ...prev,
      [subjectKey]: newVal,
    }));
    setUpdatingSubject(subjectKey);

    try {
      await api.toggleCompletion(student.rollNo, subjectKey, newVal);
    } catch (err) {
      console.error('Failed to update completion status:', err);
      // Revert on error
      setCompletions((prev) => ({
        ...prev,
        [subjectKey]: currentVal,
      }));
    } finally {
      setUpdatingSubject(null);
    }
  };

  const completedCount = Object.values(completions).filter(Boolean).length;
  const progressPercent = Math.round((completedCount / 4) * 100);

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6">
      {/* Student Welcome Header Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl p-5 sm:p-7 shadow-xl shadow-slate-200/70 border border-slate-100 mb-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <UserAvatar
              avatar={student.avatar}
              role="student"
              size="xl"
              showCameraBadge
              onCameraClick={onOpenChangeDp || onOpenProfile}
              onClick={onOpenChangeDp || onOpenProfile}
              title="Click to Change DP / Profile Picture"
            />
            <div>
              <div className="flex items-center flex-wrap gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                  PM SHRI KVS Mandla
                </span>
                <span className="text-xs font-black uppercase tracking-wider text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                  Class 5 • Roll No. {student.rollNo}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                Hi, {student.name}! 👋
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Check your subjects, complete homework & ask doubts anytime.
              </p>
            </div>
          </div>

          {/* Quick Action: Ask Doubt & Profile */}
          <div className="flex items-center gap-2.5 self-end sm:self-center">
            <motion.button
              id="student-hw-history-top-btn"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={onOpenHistory}
              className="flex items-center gap-1.5 text-sm font-bold py-2.5 px-3.5 rounded-xl transition-all cursor-pointer shadow-xs border bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200"
              title="View on which date which homework was sent or completed"
            >
              <Calendar className="w-4 h-4 text-blue-500" />
              <span>HW History</span>
            </motion.button>

            <motion.button
              id="student-ask-doubt-top-btn"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={onOpenDoubts}
              className="relative flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-bold py-2.5 px-4 rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Ask Doubt</span>
              {unreadDoubtReplies > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white animate-bounce">
                  {unreadDoubtReplies}
                </span>
              )}
            </motion.button>

            <button
              id="student-profile-quick-btn"
              onClick={onOpenProfile}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold py-2.5 px-3 rounded-xl transition-all"
            >
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Profile</span>
            </button>
          </div>
        </div>

        {/* Today's Progress Bar */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              Homework Completion Progress
            </span>
            <span className={completedCount === 4 ? 'text-emerald-600 font-extrabold' : 'text-blue-600'}>
              {completedCount}/4 Completed ({progressPercent}%)
            </span>
          </div>
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className={`h-full rounded-full transition-all duration-300 ${
                completedCount === 4
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                  : 'bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500'
              }`}
            />
          </div>
        </div>

        {/* Quick Access to Homework History */}
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 sm:px-4 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 rounded-2xl border border-blue-200/80 text-xs">
          <div className="flex items-center gap-2 text-slate-700 font-medium">
            <span className="text-base select-none">📅</span>
            <span>
              Need to see past dates' homework or check when you completed assignments?
            </span>
          </div>
          <button
            type="button"
            onClick={onOpenHistory}
            className="self-start sm:self-auto font-black text-blue-700 hover:text-blue-950 bg-white hover:bg-blue-50 px-3.5 py-1.5 rounded-xl border border-blue-200 shadow-xs transition-all cursor-pointer whitespace-nowrap active:scale-95"
          >
            Check Homework History →
          </button>
        </div>
      </motion.div>

      {/* Birthday Celebration Banner if today is student's birthday */}
      {isBirthday && <BirthdayBanner studentName={student.name} />}

      {/* Today's Homework View */}
      {activeTab === 'today' && (
        <>
          {/* Main Section Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <span className="text-2xl select-none">📚</span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                Your Today's Homework
              </h2>
            </div>
            <button
              id="student-refresh-hw-btn"
              onClick={loadStudentData}
              title="Refresh Homework"
              className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-blue-600 bg-white hover:bg-blue-50 px-3 py-1.5 rounded-xl border border-slate-200 transition-colors shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>

          {/* Four Core Subjects Homework List */}
          <div className="space-y-4 mb-8">
            {SUBJECT_ORDER.map((subjectKey) => {
              const config = SUBJECTS_CONFIG[subjectKey];
              const hw = homework ? homework[subjectKey] : null;
              const isDone = completions[subjectKey];
              const isToggling = updatingSubject === subjectKey;

              return (
                <motion.div
                  key={subjectKey}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className={`rounded-3xl border-2 transition-all p-5 sm:p-6 shadow-md ${
                    isDone
                      ? 'bg-emerald-50/70 border-emerald-300 shadow-emerald-500/5'
                      : 'bg-white border-slate-200 shadow-slate-200/50 hover:border-blue-300'
                  }`}
                >
                  {/* Subject Title Bar */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center shrink-0">
                        <span className={config.flag.length > 2 ? "text-base font-black tracking-tight text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200" : "text-2xl"}>
                          {config.flag}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg sm:text-xl font-black text-slate-900">
                            {config.name}
                          </h3>
                          {isDone && (
                            <span className="text-[11px] font-extrabold uppercase bg-emerald-600 text-white px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                              <CheckCircle2 className="w-3 h-3" /> Done
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 font-medium">
                          Teacher: <strong className="text-slate-700">{config.teacherName}</strong>
                        </p>
                      </div>
                    </div>

                    {/* Assigned date */}
                    <div className="flex flex-wrap items-center gap-1.5 self-start">
                      {hw?.assignedDate && (
                        <div className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg flex items-center gap-1 shrink-0">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{hw.assignedDate}</span>
                        </div>
                      )}
                    </div>
                  </div>

              {/* Homework Text Content */}
              <div className="my-3 bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80 text-sm sm:text-base text-slate-800 leading-relaxed font-medium">
                {hw?.content ? (
                  <p className="whitespace-pre-wrap">{hw.content}</p>
                ) : (
                  <p className="text-slate-400 italic">
                    No homework entered yet for today. Please check back later!
                  </p>
                )}
              </div>

              {/* Attached PDF Worksheets & Images for this subject */}
              {hw?.attachments && hw.attachments.length > 0 && (
                <div className="my-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200/90 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                      <Paperclip className="w-4 h-4 text-emerald-600" />
                      Teacher's Attached Files &amp; Photos ({hw.attachments.length})
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Tap to View or Download
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {hw.attachments.map((file) => {
                      const isImage = file.fileType === 'image' || /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(file.fileName);

                      return (
                        <div
                          key={file.id}
                          className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center justify-between gap-2 hover:shadow-md transition-all"
                        >
                          <div className="flex items-center space-x-2.5 overflow-hidden">
                            {isImage ? (
                              <div
                                className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-slate-200 bg-slate-100 cursor-pointer shadow-xs group"
                                onClick={() => setViewingImage(file)}
                                title="Click to view photo"
                              >
                                <img
                                  src={file.thumbnailUrl || file.viewUrl || `/api/files/view/${file.id}`}
                                  alt={file.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                />
                              </div>
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-rose-600 text-white font-black text-[10px] flex items-center justify-center shrink-0 shadow-sm">
                                PDF
                              </div>
                            )}
                            <div className="overflow-hidden">
                              <h5 className="text-xs font-black text-slate-900 truncate" title={file.title || file.fileName}>
                                {file.title || file.fileName}
                              </h5>
                              <p className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                                <span>{isImage ? '🖼️ Photo' : '📄 PDF'}</span>
                                <span>•</span>
                                <span>{file.fileSizeBytes}</span>
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {isImage ? (
                              <button
                                type="button"
                                onClick={() => setViewingImage(file)}
                                className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                                title="View Image"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setViewingPdf(file)}
                                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                                title="Preview PDF"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <a
                              href={file.downloadUrl || `/api/files/download/${file.id}`}
                              download={file.fileName}
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm transition-colors cursor-pointer"
                              title={isImage ? "Download Photo" : "Download PDF"}
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Download</span>
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Interactive Clickable Checkbox Button */}
              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <motion.button
                  id={`hw-checkbox-${subjectKey}`}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleToggleCompletion(subjectKey)}
                  disabled={isToggling}
                  className={`w-full sm:w-auto flex items-center justify-center sm:justify-start gap-3 py-3 px-5 rounded-2xl font-black text-sm sm:text-base transition-all cursor-pointer shadow-sm ${
                    isDone
                      ? 'bg-emerald-600 text-white shadow-emerald-600/30 hover:bg-emerald-700'
                      : 'bg-white hover:bg-slate-50 text-slate-800 border-2 border-slate-300 hover:border-blue-500'
                  }`}
                >
                  <div className="shrink-0 text-xl">
                    {isDone ? (
                      <CheckCircle2 className="w-6 h-6 text-white" />
                    ) : (
                      <Circle className="w-6 h-6 text-slate-400 hover:text-blue-500" />
                    )}
                  </div>
                  <span>
                    {isDone ? `☑ ${config.name} HW Completed` : `☐ ${config.name} HW`}
                  </span>
                  {isToggling && (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin ml-1"></div>
                  )}
                </motion.button>

                <p className="text-[11px] text-slate-400 text-center sm:text-right font-medium">
                  {isDone ? '✓ Teacher can see this is completed' : 'Tap to mark as finished'}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* 📄 Teacher PDF Worksheets Repository Section */}
      {allPdfFiles.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-md shadow-slate-200/50 mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-xl shrink-0">
                📑
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <span>Class 5 PDF Worksheets & Study Notes</span>
                  <span className="text-xs bg-rose-100 text-rose-800 font-extrabold px-2 py-0.5 rounded-full">
                    {allPdfFiles.length} Available
                  </span>
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Sent by your teachers. Download and practice questions offline on your phone or tablet!
                </p>
              </div>
            </div>

            {/* Filter by subject */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setSelectedSubjectFilter('all')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  selectedSubjectFilter === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All ({allPdfFiles.length})
              </button>
              {SUBJECT_ORDER.map((subj) => {
                const count = allPdfFiles.filter((f) => f.subject === subj || f.homeworkSubject === subj).length;
                if (count === 0) return null;
                const cfg = SUBJECTS_CONFIG[subj];
                return (
                  <button
                    key={subj}
                    type="button"
                    onClick={() => setSelectedSubjectFilter(subj)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                      selectedSubjectFilter === subj
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <span>{cfg.flag}</span>
                    <span>{cfg.name}</span>
                    <span className="text-[10px] opacity-80">({count})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Grid of PDF Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {allPdfFiles
              .filter((f) => selectedSubjectFilter === 'all' || f.subject === selectedSubjectFilter || f.homeworkSubject === selectedSubjectFilter)
              .map((file) => (
                <div
                  key={file.id}
                  className="p-3.5 rounded-2xl bg-slate-50 hover:bg-white border-2 border-slate-200 hover:border-rose-300 shadow-sm transition-all flex items-center justify-between gap-3"
                >
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-md">
                      PDF
                    </div>
                    <div className="overflow-hidden">
                      <h4 className="text-xs sm:text-sm font-black text-slate-900 truncate" title={file.title || file.fileName}>
                        {file.title || file.fileName}
                      </h4>
                      <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                        <span className="font-bold text-slate-700">{file.subjectName || file.subject.toUpperCase()}</span> • {file.fileSizeBytes} • {file.teacherName}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setViewingPdf(file)}
                      className="p-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                      title="View PDF"
                    >
                      <Eye className="w-4 h-4 text-slate-600" />
                    </button>
                    <a
                      href={file.downloadUrl || `/api/files/download/${file.id}`}
                      download={file.fileName}
                      className="px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md shadow-rose-600/20 transition-all cursor-pointer"
                      title="Download PDF"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download</span>
                    </a>
                  </div>
                </div>
              ))}
          </div>
        </motion.div>
      )}

      {/* Bottom Floating/Fixed Doubt Action Banner */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 rounded-3xl p-5 sm:p-6 text-white shadow-xl shadow-indigo-600/25 flex flex-col sm:flex-row items-center justify-between gap-4"
      >
        <div className="flex items-center space-x-3.5 text-center sm:text-left">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-2xl shrink-0 backdrop-blur-sm border border-white/30">
            💬
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-black">
              Have a question or stuck on homework?
            </h3>
            <p className="text-xs sm:text-sm text-blue-100/90 font-medium">
              Send a private doubt directly to your subject teacher.
            </p>
          </div>
        </div>

        <motion.button
          id="student-ask-doubt-bottom-btn"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={onOpenDoubts}
          className="w-full sm:w-auto shrink-0 bg-yellow-400 hover:bg-yellow-300 text-blue-950 font-black text-sm sm:text-base py-3 px-6 rounded-2xl shadow-lg shadow-yellow-400/30 flex items-center justify-center gap-2 cursor-pointer transition-all"
        >
          <MessageSquare className="w-5 h-5 text-blue-900" />
          <span>Ask Teacher a Doubt</span>
        </motion.button>
      </motion.div>
        </>
      )}

      {/* PDF Document Viewer Modal */}
      {viewingPdf && (
        <PdfViewerModal
          file={viewingPdf}
          onClose={() => setViewingPdf(null)}
        />
      )}

      {/* Photo / Image Viewer Modal */}
      {viewingImage && (
        <ImageViewerModal
          file={viewingImage}
          onClose={() => setViewingImage(null)}
        />
      )}

    </div>
  );
};
