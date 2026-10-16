import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MessageSquare,
  CheckCircle2,
  XCircle,
  Save,
  Search,
  Filter,
  Cake,
  Sparkles,
  RefreshCw,
  Send,
  Users,
  BookOpen,
  Check,
  AlertCircle,
  Trash2,
  Eraser,
  FileText,
  Download,
  Upload,
  Eye,
  Paperclip,
  Plus,
  FileUp,
  Image as ImageIcon,
  Key,
  RotateCcw,
  Calendar,
  Layers,
  Award,
  TrendingUp,
  ChevronRight,
} from 'lucide-react';
import { Teacher, HomeworkMap, SubjectKey, PdfDocument, StudentCategory, HomeworkItem } from '../types';
import { SUBJECTS_CONFIG, isBirthdayToday, STUDENT_CATEGORIES, CATEGORY_ORDER } from '../studentData';
import { getTodaySchoolDate, isSundayOrSecondSaturday } from '../lib/dateUtils';
import { api } from '../lib/api';
import { PdfViewerModal } from './PdfViewerModal';
import { ImageViewerModal } from './ImageViewerModal';
import { ClassPasswordsModal } from './ClassPasswordsModal';
import { UserAvatar } from './UserAvatar';
import { StudentCategoryManager } from './StudentCategoryManager';

interface StudentMatrixRow {
  rollNo: number;
  name: string;
  dob: string;
  avatar?: string;
  category?: StudentCategory;
  english: boolean;
  twau: boolean;
  maths: boolean;
  hindi: boolean;
}

interface PendingAttachment {
  tempId: string;
  file: File;
  dataUrl: string;
  fileName: string;
  title: string;
  fileType: 'pdf' | 'image' | 'file';
  sizeBytes: string;
}

interface TeacherDashboardProps {
  teacher: Teacher;
  onOpenDoubtsForStudent: (rollNo: number, studentName?: string) => void;
  onOpenProfile: () => void;
  onOpenChangeDp?: () => void;
  onOpenHistory: () => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  teacher,
  onOpenDoubtsForStudent,
  onOpenProfile,
  onOpenChangeDp,
  onOpenHistory,
}) => {
  const [activeTab, setActiveTab] = useState<
    'homework' | 'categoryHw' | 'categories' | 'completions' | 'doubts' | 'pdfs'
  >('homework');
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<'all' | StudentCategory>('all');
  const [studentCategories, setStudentCategories] = useState<Record<number, StudentCategory>>({});
  const [categoryHomeworkMap, setCategoryHomeworkMap] = useState<
    Record<string, Partial<Record<StudentCategory | 'all', HomeworkItem>>>
  >({});
  const [categoryFilterInCompletions, setCategoryFilterInCompletions] = useState<'all' | StudentCategory>('all');
  const [homeworkContent, setHomeworkContent] = useState<string>('');
  const [currentHomeworkMap, setCurrentHomeworkMap] = useState<HomeworkMap | null>(null);
  const [savingHW, setSavingHW] = useState<boolean>(false);
  const [clearingHW, setClearingHW] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [clearSuccess, setClearSuccess] = useState<boolean>(false);
  const [errorHW, setErrorHW] = useState<string | null>(null);

  // PDF Worksheets & Attached Files State
  const [pdfFiles, setPdfFiles] = useState<PdfDocument[]>([]);
  const [hwAttachments, setHwAttachments] = useState<PdfDocument[]>([]);
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);
  const [showAttachMenu, setShowAttachMenu] = useState<boolean>(false);
  const [uploadingPdf, setUploadingPdf] = useState<boolean>(false);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState<string | null>(null);
  const [uploadErrorMsg, setUploadErrorMsg] = useState<string | null>(null);
  const [pdfTitleInput, setPdfTitleInput] = useState<string>('');
  const [pdfAttachToHwCheckbox, setPdfAttachToHwCheckbox] = useState<boolean>(true);
  const [selectedFileToUpload, setSelectedFileToUpload] = useState<File | null>(null);
  const [selectedFileDataUrl, setSelectedFileDataUrl] = useState<string | null>(null);
  const [viewingPdf, setViewingPdf] = useState<PdfDocument | null>(null);
  const [viewingImage, setViewingImage] = useState<PdfDocument | null>(null);
  const [deletingPdfId, setDeletingPdfId] = useState<string | null>(null);
  const pdfFileInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const attachMenuRef = useRef<HTMLDivElement | null>(null);

  const [studentMatrix, setStudentMatrix] = useState<StudentMatrixRow[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [subjectFilter, setSubjectFilter] = useState<'all' | SubjectKey>('all');
  const [completionFilter, setCompletionFilter] = useState<'all' | 'completed' | 'pending'>('all');

  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [doubtThreads, setDoubtThreads] = useState<any[]>([]);
  const [latestUnreadRoll, setLatestUnreadRoll] = useState<number | null>(null);
  const [latestUnreadName, setLatestUnreadName] = useState<string | null>(null);
  const [deletingThreadRoll, setDeletingThreadRoll] = useState<number | null>(null);

  const [birthdayStudents, setBirthdayStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showClassPasswordsModal, setShowClassPasswordsModal] = useState<boolean>(false);

  const isSmriti =
    teacher.subject === 'twau' ||
    teacher.id === 'teacher_twau' ||
    teacher.name.toLowerCase().includes('smriti');

  const subjectConfig = SUBJECTS_CONFIG[teacher.subject];

  const loadAllTeacherData = async () => {
    try {
      const [hwData, compData, doubtData, bdayData, pdfData, catData, catHwData] = await Promise.all([
        api.getHomework(),
        api.getAllCompletions(),
        api.getDoubts(),
        api.getBirthdaysToday(),
        api.getPdfFiles(teacher.subject),
        api.getStudentCategories(),
        api.getCategoryHomework(),
      ]);

      if (catData?.categories) {
        setStudentCategories(catData.categories);
      }

      if (catHwData?.categoryHomework) {
        setCategoryHomeworkMap(catHwData.categoryHomework);
      }

      if (hwData) {
        setCurrentHomeworkMap(hwData);
        if (selectedCategoryTab === 'all' && hwData[teacher.subject]) {
          setHomeworkContent(hwData[teacher.subject].content || '');
          setHwAttachments(hwData[teacher.subject].attachments || []);
        } else if (selectedCategoryTab !== 'all') {
          const catHw = catHwData?.categoryHomework?.[teacher.subject]?.[selectedCategoryTab];
          if (catHw) {
            setHomeworkContent(catHw.content || '');
            setHwAttachments(catHw.attachments || []);
          }
        }
      }

      if (pdfData?.files) {
        setPdfFiles(pdfData.files);
      }

      if (compData?.matrix) {
        setStudentMatrix(compData.matrix);
      }

      if (doubtData) {
        setUnreadCount(doubtData.totalUnread || 0);
        setDoubtThreads(doubtData.threads || []);

        // Find the latest unread student roll if any
        const unreadThread = (doubtData.threads || []).find((t: any) => t.unreadCount > 0);
        if (unreadThread) {
          setLatestUnreadRoll(unreadThread.rollNo);
          setLatestUnreadName(unreadThread.studentName);
        } else {
          setLatestUnreadRoll(null);
          setLatestUnreadName(null);
        }
      }

      if (bdayData?.celebratingStudents) {
        setBirthdayStudents(bdayData.celebratingStudents);
      }
    } catch (err) {
      console.error('Failed to load teacher dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllTeacherData();
    const interval = setInterval(loadAllTeacherData, 8000); // 8-second live polling for doubts/HW
    return () => clearInterval(interval);
  }, [teacher.subject]);

  // Close attachment dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (attachMenuRef.current && !attachMenuRef.current.contains(e.target as Node)) {
        setShowAttachMenu(false);
      }
    };
    if (showAttachMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showAttachMenu]);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleSelectPendingAttachment = (
    e: React.ChangeEvent<HTMLInputElement>,
    targetType: 'file' | 'image'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      setErrorHW('Selected file size must be less than 25 MB.');
      return;
    }

    const isImage = targetType === 'image' || file.type.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(file.name);
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const determinedType: 'pdf' | 'image' | 'file' = isImage ? 'image' : isPdf ? 'pdf' : 'file';

    const cleanTitle = file.name
      .replace(/\.[^/.]+$/, '')
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase());

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const newPending: PendingAttachment = {
        tempId: `pending_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        file,
        dataUrl,
        fileName: file.name,
        title: cleanTitle,
        fileType: determinedType,
        sizeBytes: formatFileSize(file.size),
      };
      setPendingAttachments((prev) => [...prev, newPending]);
      setErrorHW(null);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemovePendingAttachment = (tempId: string) => {
    setPendingAttachments((prev) => prev.filter((p) => p.tempId !== tempId));
  };

  const handleRemoveHwAttachment = (id: string) => {
    setHwAttachments((prev) => prev.filter((att) => att.id !== id));
  };

  const handleSelectCategoryInEditor = (cat: 'all' | StudentCategory) => {
    setSelectedCategoryTab(cat);
    if (cat === 'all') {
      const hw = currentHomeworkMap?.[teacher.subject];
      setHomeworkContent(hw?.content || '');
      setHwAttachments(hw?.attachments || []);
    } else {
      const catHw = categoryHomeworkMap[teacher.subject]?.[cat];
      if (catHw && catHw.content) {
        setHomeworkContent(catHw.content);
        setHwAttachments(catHw.attachments || []);
      } else {
        setHomeworkContent('');
        setHwAttachments([]);
      }
    }
    setPendingAttachments([]);
    setErrorHW(null);
  };

  const handleSaveHomework = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!homeworkContent.trim() && hwAttachments.length === 0 && pendingAttachments.length === 0) {
      setErrorHW('Please enter homework instructions or attach a file or photo before publishing.');
      return;
    }

    setSavingHW(true);
    setErrorHW(null);
    setSaveSuccess(false);

    try {
      const finalAttachments = [...hwAttachments];

      // Upload all newly selected files/images from the (+) button
      if (pendingAttachments.length > 0) {
        for (const pending of pendingAttachments) {
          const uploadRes = await api.uploadFile({
            fileName: pending.fileName,
            title: pending.title,
            subject: teacher.subject,
            dataUrl: pending.dataUrl,
            attachToHomework: true,
            fileType: pending.fileType,
          });
          if (uploadRes.success && uploadRes.file) {
            finalAttachments.push(uploadRes.file);
          }
        }
      }

      const res = await api.updateHomework(
        teacher.subject,
        homeworkContent.trim(),
        finalAttachments,
        selectedCategoryTab,
        getTodaySchoolDate()
      );
      if (res.success) {
        setSaveSuccess(true);
        setPendingAttachments([]);
        setHwAttachments(finalAttachments);
        loadAllTeacherData();
        setTimeout(() => setSaveSuccess(false), 4000);
      } else {
        setErrorHW(res.error || 'Failed to save homework.');
      }
    } catch (err) {
      setErrorHW("Oops! Could not catch network. Please check your internet connection.");
    } finally {
      setSavingHW(false);
    }
  };

  const handleClearHomework = async () => {
    const catLabel = selectedCategoryTab === 'all' ? 'All Class 5' : STUDENT_CATEGORIES[selectedCategoryTab].label;
    const confirmClear = window.confirm(
      `Are you sure you want to empty and clear the published ${subjectConfig?.name} homework for ${catLabel}?`
    );
    if (!confirmClear) return;

    setClearingHW(true);
    setErrorHW(null);
    setClearSuccess(false);

    try {
      const res = await api.updateHomework(teacher.subject, '', [], selectedCategoryTab, getTodaySchoolDate());
      if (res.success) {
        setHomeworkContent('');
        setHwAttachments([]);
        setClearSuccess(true);
        loadAllTeacherData();
        setTimeout(() => setClearSuccess(false), 4000);
      } else {
        setErrorHW(res.error || 'Failed to clear homework.');
      }
    } catch (err) {
      setErrorHW("Oops! Could not catch network. Please check your internet connection.");
    } finally {
      setClearingHW(false);
    }
  };

  const handleSelectPdfFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setUploadErrorMsg('Only PDF files (.pdf) are allowed.');
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setUploadErrorMsg('PDF file size must be less than 25 MB.');
      return;
    }

    setUploadErrorMsg(null);
    setUploadSuccessMsg(null);
    setSelectedFileToUpload(file);

    // Clean name for title: e.g. "maths_chapter4_practice.pdf" -> "Maths Chapter 4 Practice"
    const cleanedTitle = file.name
      .replace(/\.pdf$/i, '')
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase());
    setPdfTitleInput(cleanedTitle);

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedFileDataUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleUploadPdf = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFileToUpload || !selectedFileDataUrl) {
      setUploadErrorMsg('Please select a PDF file first.');
      return;
    }

    setUploadingPdf(true);
    setUploadErrorMsg(null);
    setUploadSuccessMsg(null);

    try {
      const title = pdfTitleInput.trim() || selectedFileToUpload.name;
      const res = await api.uploadPdf({
        fileName: selectedFileToUpload.name,
        title,
        subject: teacher.subject,
        dataUrl: selectedFileDataUrl,
        attachToHomework: pdfAttachToHwCheckbox,
      });

      if (res.success && res.file) {
        setUploadSuccessMsg(`✓ Successfully uploaded "${title}"!`);
        setSelectedFileToUpload(null);
        setSelectedFileDataUrl(null);
        setPdfTitleInput('');
        await loadAllTeacherData();
        setTimeout(() => setUploadSuccessMsg(null), 5000);
      } else {
        setUploadErrorMsg(res.error || 'Failed to upload PDF file.');
      }
    } catch (err) {
      setUploadErrorMsg("Oops! Could not catch network. Please check your internet connection.");
    } finally {
      setUploadingPdf(false);
    }
  };

  const handleToggleAttachmentToHomework = async (file: PdfDocument) => {
    const isCurrentlyAttached = hwAttachments.some((f) => f.id === file.id);
    let updatedAttachments: PdfDocument[];

    if (isCurrentlyAttached) {
      updatedAttachments = hwAttachments.filter((f) => f.id !== file.id);
    } else {
      updatedAttachments = [...hwAttachments, file];
    }

    setHwAttachments(updatedAttachments);

    try {
      const res = await api.updateHomework(teacher.subject, homeworkContent, updatedAttachments);
      if (res.success) {
        await loadAllTeacherData();
      }
    } catch (err) {
      console.error('Failed to toggle homework attachment:', err);
    }
  };

  const handleDeletePdf = async (fileId: string, fileName: string) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to permanently delete "${fileName}"? It will also be removed from any daily homework.`
    );
    if (!confirmDelete) return;

    setDeletingPdfId(fileId);
    try {
      const res = await api.deletePdf(fileId);
      if (res.success) {
        setPdfFiles((prev) => prev.filter((f) => f.id !== fileId));
        setHwAttachments((prev) => prev.filter((f) => f.id !== fileId));
        await loadAllTeacherData();
      } else {
        alert(res.error || 'Failed to delete PDF.');
      }
    } catch (err) {
      alert('Error deleting PDF file.');
    } finally {
      setDeletingPdfId(null);
    }
  };

  const handleDeleteChatThread = async (rollNo: number, studentName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmDelete = window.confirm(
      `Are you sure you want to permanently delete all chat messages with ${studentName} (Roll ${rollNo})?`
    );
    if (!confirmDelete) return;

    setDeletingThreadRoll(rollNo);
    try {
      const res = await api.clearDoubtThread(rollNo);
      if (res.success) {
        setDoubtThreads((prev) => prev.filter((t) => t.rollNo !== rollNo));
        loadAllTeacherData();
      }
    } catch (err) {
      console.error('Failed to delete doubt thread:', err);
    } finally {
      setDeletingThreadRoll(null);
    }
  };

  // Filter student matrix
  const filteredMatrix = studentMatrix.filter((st) => {
    const matchesSearch =
      st.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      st.rollNo.toString().includes(searchQuery);

    if (!matchesSearch) return false;

    if (categoryFilterInCompletions !== 'all') {
      const cat = st.category || studentCategories[st.rollNo] || 'progressive';
      if (cat !== categoryFilterInCompletions) return false;
    }

    if (completionFilter === 'all') return true;

    const isSubjectDone = subjectFilter === 'all'
      ? st[teacher.subject]
      : st[subjectFilter];

    if (completionFilter === 'completed') return isSubjectDone;
    if (completionFilter === 'pending') return !isSubjectDone;

    return true;
  });

  // Calculate subject completion statistics
  const subjectDoneCount = studentMatrix.filter((st) => st[teacher.subject]).length;
  const totalStudents = studentMatrix.length || 41;
  const subjectPercent = Math.round((subjectDoneCount / totalStudents) * 100);

  const handleToggleStudentSubject = async (rollNo: number, subject: SubjectKey, currentStatus: boolean) => {
    try {
      setStudentMatrix((prev) =>
        prev.map((row) => (row.rollNo === rollNo ? { ...row, [subject]: !currentStatus } : row))
      );
      const res = await api.toggleCompletion(rollNo, subject, !currentStatus);
      if (!res.success) {
        setStudentMatrix((prev) =>
          prev.map((row) => (row.rollNo === rollNo ? { ...row, [subject]: currentStatus } : row))
        );
      }
    } catch (e) {
      console.error('Failed to toggle completion:', e);
    }
  };

  const handleResetStudentCompletions = async (rollNo: number, studentName: string) => {
    if (!window.confirm(`Clear and delete all done homework records for ${studentName} (Roll ${rollNo})?`)) {
      return;
    }
    try {
      const res = await api.resetStudentCompletions(rollNo);
      if (res.success) {
        setStudentMatrix((prev) =>
          prev.map((row) =>
            row.rollNo === rollNo
              ? { ...row, english: false, twau: false, maths: false, hindi: false }
              : row
          )
        );
      }
    } catch (e) {
      console.error('Failed to reset student completions:', e);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6">
      {/* Teacher Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl p-5 sm:p-7 shadow-xl shadow-slate-200/70 border border-slate-100 mb-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <UserAvatar
              avatar={teacher.avatar}
              role="teacher"
              defaultIcon={subjectConfig?.flag}
              size="xl"
              showCameraBadge
              onCameraClick={onOpenChangeDp || onOpenProfile}
              onClick={onOpenChangeDp || onOpenProfile}
              title="Click to Change DP / Profile Picture"
            />
            <div>
              <div className="flex items-center flex-wrap gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  PM SHRI KVS Mandla
                </span>
                <span className="text-xs font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                  <span>{subjectConfig?.flag}</span>
                  <span>{subjectConfig?.name} Faculty</span>
                </span>
                <span className="text-xs font-bold text-slate-500">Class 5</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                Hi, {teacher.name}! 👋
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Manage {subjectConfig?.name} homework, track Class 5 student completions & reply to doubts.
              </p>
            </div>
          </div>

          {/* Teacher Action Quick Controls */}
          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              id="teacher-refresh-btn"
              onClick={loadAllTeacherData}
              title="Refresh Data"
              className="p-2.5 text-slate-600 hover:text-emerald-700 bg-slate-100 hover:bg-emerald-50 rounded-xl transition-colors active:scale-95 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
            </button>

            {/* Smriti Ma'am Exclusive Class Passwords Button */}
            {isSmriti && (
              <button
                id="smriti-header-passwords-btn"
                type="button"
                onClick={() => setShowClassPasswordsModal(true)}
                className="flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs sm:text-sm font-bold py-2 px-3 rounded-xl transition-all cursor-pointer shadow-xs active:scale-95"
                title="Class 5 Student Passwords Directory (Exclusive to Smriti Ma'am)"
              >
                <Key className="w-3.5 h-3.5 text-indigo-600" />
                <span className="hidden sm:inline">Class Passwords</span>
                <span className="sm:hidden">Passwords</span>
              </button>
            )}

            {/* Homework History Button */}
            <button
              id="teacher-hw-history-header-btn"
              type="button"
              onClick={onOpenHistory}
              className="flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs sm:text-sm font-bold py-2 px-3 rounded-xl transition-all cursor-pointer shadow-xs active:scale-95"
              title="View on which date which homework was sent or completed"
            >
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">HW History</span>
              <span className="sm:hidden">History</span>
            </button>

            <button
              id="teacher-profile-top-btn"
              onClick={onOpenProfile}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold py-2 px-3.5 rounded-xl transition-all cursor-pointer"
            >
              <span>Profile</span>
            </button>
          </div>
        </div>

        {/* Live Subject Homework Completion Metric */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <span>{subjectConfig?.flag}</span>
            <span>{subjectConfig?.name} Completion:</span>
            <span className="text-emerald-600 font-black text-sm">
              {subjectDoneCount}/{totalStudents} Students ({subjectPercent}%)
            </span>
          </div>

          <div className="flex-1 max-w-xs h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${subjectPercent}%` }}
            />
          </div>
        </div>
      </motion.div>

      {/* 🔴 RED NOTIFICATION BANNER FOR NEW DOUBTS (Requirement 8) */}
      <AnimatePresence>
        {unreadCount > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full bg-gradient-to-r from-red-600 via-rose-600 to-red-500 text-white rounded-3xl p-4 sm:p-5 shadow-xl shadow-red-500/25 border-2 border-white mb-6 flex flex-col sm:flex-row items-center justify-between gap-3 cursor-pointer"
            onClick={() => {
              if (latestUnreadRoll) {
                onOpenDoubtsForStudent(latestUnreadRoll, latestUnreadName || undefined);
              } else {
                setActiveTab('doubts');
              }
            }}
          >
            <div className="flex items-center space-x-3 text-center sm:text-left">
              <span className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center text-xl shrink-0 animate-pulse">
                🔴
              </span>
              <div>
                <div className="flex items-center gap-2 justify-center sm:justify-start">
                  <span className="text-xs font-black uppercase tracking-wider bg-white/25 px-2 py-0.5 rounded-full">
                    Urgent Doubts
                  </span>
                  <span className="text-xs font-black bg-white text-red-700 px-2 py-0.5 rounded-full">
                    {unreadCount} New
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-black mt-0.5">
                  {latestUnreadRoll
                    ? `🔴 New doubt from Roll No. ${latestUnreadRoll} (${latestUnreadName || 'Student'})`
                    : `🔴 Student Doubts — ${unreadCount} new question(s)`}
                </h3>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-white text-red-700 hover:bg-red-50 font-black text-xs sm:text-sm py-2.5 px-5 rounded-xl shadow-md flex items-center gap-1.5 shrink-0"
            >
              <MessageSquare className="w-4 h-4 text-red-600" />
              <span>Open Private Chat</span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🎂 Today's Birthdays Notification for Teachers (Requirement 9) */}
      {birthdayStudents.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-3xl p-4 sm:p-5 shadow-lg shadow-orange-500/20 mb-6 flex items-center justify-between gap-3"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-xl shrink-0">
              🎂
            </div>
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-100">
                Class 5 Birthday Alert
              </span>
              <h4 className="text-sm sm:text-base font-black">
                Today's Birthday:{' '}
                {birthdayStudents.map((s) => `${s.name} (Roll ${s.rollNo})`).join(', ')} 🎉
              </h4>
            </div>
          </div>
          <span className="text-xs font-bold bg-white/20 px-3 py-1 rounded-xl hidden sm:inline-block">
            Wish in Class!
          </span>
        </motion.div>
      )}

      {/* Navigation Tabs for Teacher Dashboard */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
        <button
          id="teacher-tab-hw"
          onClick={() => {
            setActiveTab('homework');
            setSelectedCategoryTab('all');
          }}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'homework' && selectedCategoryTab === 'all'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>📚 Paste HOMEWORK for Class 5</span>
        </button>

        {/* Dedicated Tab: Paste HW by Student Categories (Beginner / Progressive / Proficient) */}
        <button
          id="teacher-tab-category-hw"
          onClick={() => setActiveTab('categoryHw')}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'categoryHw'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
              : 'bg-white text-purple-900 hover:bg-purple-50 border border-purple-200'
          }`}
        >
          <Layers className="w-4 h-4 text-purple-600" />
          <span>🎯 Paste HW by Student Types (Beginner / Progressive / Proficient)</span>
        </button>

        {/* Dedicated Tab: Manage Student Categories */}
        <button
          id="teacher-tab-categories"
          onClick={() => setActiveTab('categories')}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'categories'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Users className="w-4 h-4 text-indigo-600" />
          <span>👥 Manage Student Types</span>
          <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full font-black">
            41
          </span>
        </button>

        <button
          id="teacher-tab-completions"
          onClick={() => setActiveTab('completions')}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'completions'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>✅ See who completed HW</span>
          <span className="text-xs bg-slate-200 text-slate-800 px-2 py-0.5 rounded-full font-black">
            41
          </span>
        </button>

        <button
          id="teacher-tab-doubts"
          onClick={() => setActiveTab('doubts')}
          className={`relative flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'doubts'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>💬 Student Doubts</span>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs font-black px-2 py-0.5 rounded-full animate-pulse">
              {unreadCount}
            </span>
          )}
        </button>

        <button
          id="teacher-tab-pdfs"
          onClick={() => setActiveTab('pdfs')}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'pdfs'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>📄 Send PDF Worksheets</span>
          {pdfFiles.length > 0 && (
            <span className="text-xs bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-black">
              {pdfFiles.length}
            </span>
          )}
        </button>

        {/* Homework History — opens as its own full page */}
        <button
          id="teacher-tab-history"
          onClick={onOpenHistory}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm transition-all whitespace-nowrap cursor-pointer bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 hover:border-blue-300"
        >
          <Calendar className="w-4 h-4 text-blue-600" />
          <span>📅 Homework History</span>
        </button>
      </div>

      {/* TAB 1: PASTE HOMEWORK (Requirement 6) */}
      {activeTab === 'homework' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/70 border border-slate-100"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className={subjectConfig?.flag && subjectConfig.flag.length > 2 ? 'text-lg font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200 leading-none select-none' : 'text-2xl'}>
                  {subjectConfig?.flag}
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                  Paste HOMEWORK for Class 5 ({subjectConfig?.name})
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                Enter or paste today's homework and attach worksheets. You can target all students or specific student categories (Beginner, Progressive, Proficient).
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
              <span className="text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-xl">
                📅 Today: {getTodaySchoolDate()}
              </span>
            </div>
          </div>

          {/* Student Category Selector Pills in Homework Editor */}
          <div className="mb-4 bg-slate-50 border border-slate-200 p-3 rounded-2xl flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mr-1">
                <Layers className="w-3.5 h-3.5 text-emerald-600" />
                <span>Target Student Type:</span>
              </span>
              <button
                type="button"
                onClick={() => handleSelectCategoryInEditor('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  selectedCategoryTab === 'all'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                👥 All Class 5 (Common HW)
              </button>
              {CATEGORY_ORDER.map((ck) => {
                const catInfo = STUDENT_CATEGORIES[ck];
                const isSelected = selectedCategoryTab === ck;
                const count = Object.values(studentCategories).filter((c) => c === ck).length;
                return (
                  <button
                    key={ck}
                    type="button"
                    onClick={() => handleSelectCategoryInEditor(ck)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black border transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? `${catInfo.badgeColor} ring-2 ring-emerald-500/40 shadow-sm font-black`
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span>{catInfo.label}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('categories')}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
            >
              <span>Manage Student Categories</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <form onSubmit={handleSaveHomework} className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="teacher-hw-textarea"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-700"
                >
                  Homework Instructions & Questions
                </label>
                {homeworkContent && (
                  <button
                    type="button"
                    onClick={() => setHomeworkContent('')}
                    className="text-xs font-bold text-slate-400 hover:text-slate-600 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Eraser className="w-3.5 h-3.5" />
                    <span>Clear Text</span>
                  </button>
                )}
              </div>

              {/* Unified Compose Box with Textarea, Preview Strip & Bottom Left Plus Sign */}
              <div className="bg-slate-50 border-2 border-slate-200 focus-within:border-emerald-500 rounded-3xl overflow-visible shadow-inner transition-all flex flex-col">
                {/* Textarea */}
                <textarea
                  id="teacher-hw-textarea"
                  rows={4}
                  value={homeworkContent}
                  onChange={(e) => setHomeworkContent(e.target.value)}
                  placeholder={`Type or paste ${subjectConfig?.name} homework here...\nExample: Read Chapter 4 (Pages 30-35). Complete questions 1 to 5 from attached worksheet.`}
                  className="w-full p-4 sm:p-5 bg-transparent text-slate-900 text-sm sm:text-base font-medium placeholder-slate-400 focus:outline-none resize-y rounded-t-3xl"
                />

                {/* Attachments Preview Strip inside homework writing place */}
                {(pendingAttachments.length > 0 || hwAttachments.length > 0) && (
                  <div className="px-4 py-3 bg-white/95 border-t border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                      <span className="flex items-center gap-1.5 text-slate-800">
                        <Paperclip className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Attachments Ready to Send ({pendingAttachments.length + hwAttachments.length}):</span>
                      </span>
                      <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        Will be sent when you click button below
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {/* Pending items from + button */}
                      {pendingAttachments.map((pending) => (
                        <div
                          key={pending.tempId}
                          className="p-2.5 bg-emerald-50/70 border border-emerald-300 rounded-2xl flex items-center justify-between gap-2 shadow-xs"
                        >
                          <div className="flex items-center space-x-2.5 overflow-hidden">
                            {pending.fileType === 'image' ? (
                              <div
                                className="relative w-11 h-11 rounded-xl overflow-hidden shrink-0 border border-emerald-400 bg-slate-100 cursor-pointer shadow-xs group"
                                onClick={() =>
                                  setViewingImage({
                                    id: pending.tempId,
                                    fileName: pending.fileName,
                                    title: pending.title,
                                    fileType: 'image',
                                    subject: teacher.subject,
                                    subjectName: subjectConfig?.name || 'Class 5',
                                    teacherName: teacher.name,
                                    fileSize: pending.file.size,
                                    fileSizeBytes: pending.sizeBytes,
                                    uploadedAt: new Date().toISOString(),
                                    dataUrl: pending.dataUrl,
                                  })
                                }
                                title="Click to preview image"
                              >
                                <img src={pending.dataUrl} alt={pending.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                              </div>
                            ) : (
                              <div className="w-11 h-11 rounded-xl bg-rose-600 text-white font-black text-[11px] flex items-center justify-center shrink-0 shadow-xs">
                                PDF
                              </div>
                            )}
                            <div className="overflow-hidden">
                              <p className="text-xs font-bold text-slate-900 truncate" title={pending.fileName}>
                                {pending.title || pending.fileName}
                              </p>
                              <p className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                                <span>{pending.fileType === 'image' ? '🖼️ Photo / Image' : '📄 File / PDF'}</span>
                                <span>•</span>
                                <span>{pending.sizeBytes}</span>
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleRemovePendingAttachment(pending.tempId)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Remove attachment"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}

                      {/* Already published hwAttachments */}
                      {hwAttachments.map((att) => (
            <div
              key={att.id}
              className="p-2.5 bg-slate-100/90 border border-slate-200 rounded-2xl flex items-center justify-between gap-2 shadow-xs"
            >
              <div className="flex items-center space-x-2.5 overflow-hidden">
                {att.fileType === 'image' ? (
                  <div
                    className="relative w-11 h-11 rounded-xl overflow-hidden shrink-0 border border-slate-300 bg-white cursor-pointer shadow-xs"
                    onClick={() => setViewingImage(att)}
                    title="Click to view image"
                  >
                    <img
                      src={att.thumbnailUrl || att.viewUrl || `/api/files/view/${att.id}`}
                      alt={att.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-11 h-11 rounded-xl bg-rose-600 text-white font-black text-[11px] flex items-center justify-center shrink-0 shadow-xs">
                    PDF
                  </div>
                )}
                <div className="overflow-hidden">
                  <p className="text-xs font-bold text-slate-900 truncate" title={att.fileName}>
                    {att.title || att.fileName}
                  </p>
                  <p className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                    <span>{att.fileType === 'image' ? '🖼️ Photo' : '📄 Worksheet'}</span>
                    <span>•</span>
                    <span>{att.fileSizeBytes}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {att.fileType === 'image' ? (
                  <button
                    type="button"
                    onClick={() => setViewingImage(att)}
                    className="p-1.5 text-slate-500 hover:text-blue-600 rounded-lg transition-colors cursor-pointer"
                    title="Preview photo"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setViewingPdf(att)}
                    className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                    title="Preview PDF"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleRemoveHwAttachment(att.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  title="Remove from homework"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Toolbar at the Bottom of Homework Compose Box: Left Bottom (+) Plus Button */}
                <div className="px-4 py-3 bg-white border-t border-slate-200 rounded-b-3xl flex items-center justify-between relative">
                  <div className="flex items-center gap-2 relative">
                    {/* Plus (+) Button in Left Bottom */}
                    <div className="relative">
                      <button
                        id="teacher-hw-plus-btn"
                        type="button"
                        onClick={() => setShowAttachMenu((prev) => !prev)}
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all cursor-pointer shadow-md border ${
                          showAttachMenu
                            ? 'bg-rose-50 border-rose-300 text-rose-600 rotate-45 scale-105'
                            : 'bg-gradient-to-tr from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white border-emerald-400 hover:scale-105 active:scale-95 shadow-emerald-500/20'
                        }`}
                        title="Click plus (+) sign to upload files or images from gallery"
                      >
                        <Plus className="w-6 h-6 stroke-[2.5]" />
                      </button>

                      {/* Popover Menu with Options: Upload Files or Upload Images */}
                      <AnimatePresence>
                        {showAttachMenu && (
                          <motion.div
                            ref={attachMenuRef}
                            initial={{ opacity: 0, scale: 0.92, y: 8 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.92, y: 4 }}
                            className="absolute bottom-13 left-0 z-50 bg-white rounded-2xl shadow-2xl border border-slate-200 p-2 min-w-[260px] space-y-1.5"
                          >
                            <div className="px-3 py-1.5 border-b border-slate-100 flex items-center justify-between">
                              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                Add Homework Attachment
                              </span>
                              <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                                Class 5
                              </span>
                            </div>

                            {/* Option 1: Upload Files */}
                            <button
                              id="attach-file-option"
                              type="button"
                              onClick={() => {
                                setShowAttachMenu(false);
                                fileInputRef.current?.click();
                              }}
                              className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-rose-50 text-slate-700 hover:text-rose-700 transition-colors text-left cursor-pointer group"
                            >
                              <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 group-hover:bg-rose-200">
                                <FileText className="w-5 h-5" />
                              </div>
                              <div>
                                <p className="text-xs font-black text-slate-900 group-hover:text-rose-700">Upload Files / PDF</p>
                                <p className="text-[10px] text-slate-500 font-medium">Worksheets, PDFs, Documents</p>
                              </div>
                            </button>

                            {/* Option 2: Upload Images / Gallery */}
                            <button
                              id="attach-image-option"
                              type="button"
                              onClick={() => {
                                setShowAttachMenu(false);
                                imageInputRef.current?.click();
                              }}
                              className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-blue-50 text-slate-700 hover:text-blue-700 transition-colors text-left cursor-pointer group"
                            >
                              <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 group-hover:bg-blue-200">
                                <ImageIcon className="w-5 h-5" />
                              </div>
                              <div>
                                <p className="text-xs font-black text-slate-900 group-hover:text-blue-700">Upload Images / Gallery</p>
                                <p className="text-[10px] text-slate-500 font-medium">Camera photos, board pictures, diagrams</p>
                              </div>
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="text-xs text-slate-500 font-semibold flex items-center gap-1.5 pl-1">
                      <span className="hidden sm:inline">Click the </span>
                      <span className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-700 inline-flex items-center justify-center font-black text-xs">
                        +
                      </span>
                      <span>sign to upload files or images from gallery</span>
                    </div>
                  </div>

                  {/* Hidden file & image inputs */}
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    ref={fileInputRef}
                    onChange={(e) => handleSelectPendingAttachment(e, 'file')}
                    className="hidden"
                  />
                  <input
                    type="file"
                    accept="image/*"
                    ref={imageInputRef}
                    onChange={(e) => handleSelectPendingAttachment(e, 'image')}
                    className="hidden"
                  />

                  <span className="text-[11px] font-bold text-slate-400">
                    Max 25 MB
                  </span>
                </div>
              </div>
            </div>

            {/* Empty Status Indicator */}
            {!currentHomeworkMap?.[teacher.subject]?.content && (
              <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-xs font-bold text-amber-800 flex items-center gap-2">
                <span className="text-base">📝</span>
                <span>
                  Homework is currently empty. Students see "No homework assigned yet". Write instructions or attach files above and click Send.
                </span>
              </div>
            )}

            {/* Status alerts */}
            <AnimatePresence>
              {saveSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    ✓ Homework and attached files/photos successfully sent &amp; published to Class 5!
                  </span>
                </motion.div>
              )}
              {clearSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="p-3 bg-slate-100 border border-slate-300 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-2"
                >
                  <Check className="w-4 h-4 text-slate-600 shrink-0" />
                  <span>
                    ✓ Homework cleared. Students will now see that no homework is currently assigned for {subjectConfig?.name}.
                  </span>
                </motion.div>
              )}
              {errorHW && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-bold flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <span>{errorHW}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Instant sync across all student devices</span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                {currentHomeworkMap?.[teacher.subject]?.content && (
                  <button
                    id="teacher-clear-hw-btn"
                    type="button"
                    onClick={handleClearHomework}
                    disabled={clearingHW}
                    className="flex-1 sm:flex-none border border-rose-200 hover:bg-rose-50 text-rose-700 font-bold text-xs sm:text-sm py-3 px-4 rounded-2xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4 text-rose-500" />
                    <span>{clearingHW ? 'Clearing...' : 'Clear Published Homework'}</span>
                  </button>
                )}

                <motion.button
                  id="teacher-save-hw-btn"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={savingHW || (!homeworkContent.trim() && pendingAttachments.length === 0 && hwAttachments.length === 0)}
                  className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-black text-xs sm:text-base py-3.5 px-7 rounded-2xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  {savingHW ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Sending Homework &amp; Files...</span>
                    </div>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Send &amp; Publish Homework to Class 5</span>
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </form>

          {/* Quick Preview of other 3 subjects for context */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-3">
              Other Subjects Homework Today (Class 5)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {Object.values(SUBJECTS_CONFIG)
                .filter((s) => s.key !== teacher.subject)
                .map((sub) => {
                  const hw = currentHomeworkMap?.[sub.key];
                  return (
                    <div
                      key={sub.key}
                      className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80 text-xs"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-slate-800 flex items-center gap-1">
                          <span>{sub.flag}</span>
                          <span>{sub.name}</span>
                        </span>
                        <span className="text-[10px] text-slate-500 truncate max-w-[100px]">
                          {sub.teacherName.split(' ')[0]}
                        </span>
                      </div>
                      <p className="text-slate-600 line-clamp-2 italic font-medium">
                        {hw?.content || 'No homework added yet.'}
                      </p>
                    </div>
                  );
                })}
            </div>
          </div>
        </motion.div>
      )}

      {/* TAB: PASTE HOMEWORK BY STUDENT CATEGORIES (Requirement 2) */}
      {activeTab === 'categoryHw' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/70 border border-slate-100 space-y-6"
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🎯</span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                  Paste Differentiated HOMEWORK ({subjectConfig?.name})
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                Assign tailored homework for <strong>Beginner</strong>, <strong>Progressive</strong>, and <strong>Proficient</strong> students. Students will see the homework matched to their category.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center">
              <span className="text-xs font-bold bg-purple-50 text-purple-800 border border-purple-200 px-3 py-1.5 rounded-xl">
                📅 Today: {getTodaySchoolDate()}
              </span>
            </div>
          </div>

          {/* Category Tabs: Beginner, Progressive, Proficient, All */}
          <div className="flex flex-wrap items-center gap-2.5 p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
            {CATEGORY_ORDER.map((ck) => {
              const catInfo = STUDENT_CATEGORIES[ck];
              const isSelected = selectedCategoryTab === ck;
              const count = Object.values(studentCategories).filter((c) => c === ck).length;
              return (
                <button
                  key={ck}
                  type="button"
                  onClick={() => handleSelectCategoryInEditor(ck)}
                  className={`flex-1 min-w-[140px] px-4 py-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    isSelected
                      ? `${catInfo.badgeColor} shadow-md ring-2 ring-purple-500/40 font-black scale-102`
                      : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  <span className="text-base">{catInfo.label.split(' ')[0]}</span>
                  <span>{catInfo.name} Level</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/70 text-slate-800">
                    {count} Students
                  </span>
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => handleSelectCategoryInEditor('all')}
              className={`px-4 py-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 ${
                selectedCategoryTab === 'all'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              <span>👥 All Class 5 (Common)</span>
            </button>
          </div>

          {/* Active Category Information Card */}
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-900 flex items-center justify-center text-xl shrink-0">
                {selectedCategoryTab === 'all'
                  ? '👥'
                  : STUDENT_CATEGORIES[selectedCategoryTab]?.label.split(' ')[0] || '🎯'}
              </div>
              <div>
                <span className="font-extrabold text-slate-900 block text-sm">
                  {selectedCategoryTab === 'all'
                    ? 'All Class 5 Students'
                    : `${STUDENT_CATEGORIES[selectedCategoryTab]?.name} Group`}
                </span>
                <span className="text-slate-500 font-medium">
                  {selectedCategoryTab === 'all'
                    ? 'General homework sent to the entire class of 41 students.'
                    : STUDENT_CATEGORIES[selectedCategoryTab]?.description}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('categories')}
              className="px-3 py-1.5 bg-white border border-slate-300 hover:border-purple-400 rounded-xl font-bold text-slate-700 hover:text-purple-700 flex items-center gap-1.5 transition-all cursor-pointer self-start sm:self-center shadow-xs"
            >
              <Users className="w-3.5 h-3.5 text-purple-600" />
              <span>Change / Move Students</span>
            </button>
          </div>

          {/* Homework Writing Form */}
          <form onSubmit={handleSaveHomework} className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="category-hw-textarea"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5 text-purple-600" />
                  <span>
                    Homework Instructions for{' '}
                    {selectedCategoryTab === 'all'
                      ? 'All Students'
                      : `${STUDENT_CATEGORIES[selectedCategoryTab]?.name} Students`}
                  </span>
                </label>
                {homeworkContent && (
                  <button
                    type="button"
                    onClick={() => setHomeworkContent('')}
                    className="text-xs font-bold text-slate-400 hover:text-slate-600 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Eraser className="w-3.5 h-3.5" />
                    <span>Clear Text</span>
                  </button>
                )}
              </div>

              {/* Compose Box */}
              <div className="bg-slate-50 border-2 border-slate-200 focus-within:border-purple-500 rounded-3xl overflow-visible shadow-inner transition-all flex flex-col">
                <textarea
                  id="category-hw-textarea"
                  rows={4}
                  value={homeworkContent}
                  onChange={(e) => setHomeworkContent(e.target.value)}
                  placeholder={
                    selectedCategoryTab === 'beginner'
                      ? `Type or paste simplified/foundation ${subjectConfig?.name} homework for Beginner students...\nExample: Read paragraph 1 slowly. Write 3 simple sentences. Complete basic vocabulary worksheet.`
                      : selectedCategoryTab === 'proficient'
                      ? `Type or paste advanced ${subjectConfig?.name} challenge for Proficient students...\nExample: Creative writing (100 words), solve higher-order thinking question 8 on page 45, or research project.`
                      : `Type or paste standard ${subjectConfig?.name} homework for Progressive students...\nExample: Solve questions 1 to 5. Practice workbook exercise 3.`
                  }
                  className="w-full p-4 sm:p-5 bg-transparent text-slate-900 text-sm sm:text-base font-medium placeholder-slate-400 focus:outline-none resize-y rounded-t-3xl"
                />

                {/* Attachments Preview Strip */}
                {(pendingAttachments.length > 0 || hwAttachments.length > 0) && (
                  <div className="px-4 py-3 bg-white/95 border-t border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                      <span className="flex items-center gap-1.5 text-slate-800">
                        <Paperclip className="w-3.5 h-3.5 text-purple-600" />
                        <span>Attachments Ready to Send ({pendingAttachments.length + hwAttachments.length}):</span>
                      </span>
                      <span className="text-[10px] font-black text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                        Will be sent for this category
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {pendingAttachments.map((pending) => (
                        <div
                          key={pending.tempId}
                          className="p-2.5 bg-purple-50/70 border border-purple-300 rounded-2xl flex items-center justify-between gap-2 shadow-xs"
                        >
                          <div className="flex items-center space-x-2.5 overflow-hidden">
                            {pending.fileType === 'image' ? (
                              <div
                                onClick={() =>
                                  setViewingImage({
                                    id: pending.tempId,
                                    fileName: pending.fileName,
                                    title: pending.title,
                                    subject: teacher.subject,
                                    subjectName: subjectConfig?.name || '',
                                    teacherName: teacher.name,
                                    fileSize: pending.file.size,
                                    fileSizeBytes: pending.sizeBytes,
                                    uploadedAt: new Date().toISOString(),
                                    fileType: 'image',
                                    dataUrl: pending.dataUrl,
                                    viewUrl: pending.dataUrl,
                                  })
                                }
                                className="w-10 h-10 rounded-xl bg-purple-100 overflow-hidden shrink-0 border border-purple-200 cursor-pointer"
                              >
                                <img
                                  src={pending.dataUrl}
                                  alt={pending.fileName}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center text-lg shrink-0">
                                📄
                              </div>
                            )}
                            <div className="overflow-hidden">
                              <p className="text-xs font-bold text-slate-800 truncate">{pending.title}</p>
                              <span className="text-[10px] text-slate-500">{pending.sizeBytes}</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemovePendingAttachment(pending.tempId)}
                            className="p-1 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}

                      {hwAttachments.map((att) => (
                        <div
                          key={att.id}
                          className="p-2.5 bg-slate-100/90 border border-slate-200 rounded-2xl flex items-center justify-between gap-2"
                        >
                          <div className="flex items-center space-x-2.5 overflow-hidden">
                            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center text-lg shrink-0">
                              {att.fileType === 'image' ? '🖼️' : '📄'}
                            </div>
                            <div className="overflow-hidden">
                              <p className="text-xs font-bold text-slate-800 truncate">{att.title || att.fileName}</p>
                              <span className="text-[10px] text-slate-500">{att.fileSizeBytes || 'File'}</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveHwAttachment(att.id)}
                            className="p-1 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bottom Bar inside editor */}
                <div className="p-3 sm:p-4 bg-slate-100/80 rounded-b-3xl border-t border-slate-200/80 flex items-center justify-between">
                  <div className="relative" ref={attachMenuRef}>
                    <button
                      type="button"
                      onClick={() => setShowAttachMenu((prev) => !prev)}
                      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white border border-slate-300 text-slate-700 hover:text-purple-700 hover:border-purple-400 font-bold text-xs shadow-xs transition-all cursor-pointer"
                    >
                      <Plus className="w-4 h-4 text-purple-600" />
                      <span>Attach Photo / PDF Worksheet</span>
                    </button>
                  </div>

                  <span className="text-[11px] text-slate-500 font-bold hidden sm:inline">
                    Target Group: {selectedCategoryTab === 'all' ? 'All Class 5' : STUDENT_CATEGORIES[selectedCategoryTab]?.label}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClearHomework}
                  disabled={clearingHW}
                  className="border border-rose-200 hover:bg-rose-50 text-rose-700 font-bold text-xs sm:text-sm py-3 px-4 rounded-2xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Trash2 className="w-4 h-4 text-rose-500" />
                  <span>Clear This Group's Homework</span>
                </button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={savingHW || (!homeworkContent.trim() && pendingAttachments.length === 0 && hwAttachments.length === 0)}
                  className="bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 text-white font-black text-xs sm:text-base py-3.5 px-7 rounded-2xl shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  {savingHW ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Publishing...</span>
                    </div>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>
                        Publish to{' '}
                        {selectedCategoryTab === 'all'
                          ? 'All Students'
                          : `${STUDENT_CATEGORIES[selectedCategoryTab]?.name} Group`}
                      </span>
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </form>
        </motion.div>
      )}

      {/* TAB: MANAGE STUDENT CATEGORIES (Requirement 2) */}
      {activeTab === 'categories' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <StudentCategoryManager
            categories={studentCategories}
            onCategoriesChange={(updated) => {
              setStudentCategories(updated);
              setStudentMatrix((prev) =>
                prev.map((r) => ({
                  ...r,
                  category: updated[r.rollNo] || r.category || 'progressive',
                }))
              );
            }}
            onNavigateToPasteHW={(cat) => {
              if (cat && cat !== 'all') {
                handleSelectCategoryInEditor(cat);
                setActiveTab('categoryHw');
              } else {
                handleSelectCategoryInEditor('all');
                setActiveTab('homework');
              }
            }}
          />
        </motion.div>
      )}
      {activeTab === 'completions' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-6 shadow-xl shadow-slate-200/70 border border-slate-100"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                  See Who Completed HW
                </h2>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Full live roster matrix for all 41 Class 5 students (Roll 501–541)
              </p>
            </div>

            {/* Filter controls */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="student-search-input"
                  type="text"
                  placeholder="Search name or roll..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-500 w-44 sm:w-52"
                />
              </div>

              <select
                id="completion-status-filter"
                value={completionFilter}
                onChange={(e) => setCompletionFilter(e.target.value as any)}
                className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed Only (✅)</option>
                <option value="pending">Pending Only (—)</option>
              </select>
            </div>
          </div>

          {/* Full Table as explicitly specified in Requirement 7 */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 text-xs font-black uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4">Roll No.</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-3 text-center">ABC English</th>
                  <th className="py-3 px-3 text-center">🔬 TWAU</th>
                  <th className="py-3 px-3 text-center">➗ Maths</th>
                  <th className="py-3 px-3 text-center">अ Hindi</th>
                  <th className="py-3 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredMatrix.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 text-xs font-medium">
                      No students found matching "{searchQuery}".
                    </td>
                  </tr>
                ) : (
                  filteredMatrix.map((st) => {
                    const allDone = st.english && st.twau && st.maths && st.hindi;
                    return (
                      <tr
                        key={st.rollNo}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          allDone ? 'bg-emerald-50/30' : ''
                        }`}
                      >
                        <td className="py-3 px-4 font-mono font-black text-slate-900 text-xs">
                          {st.rollNo}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-800">
                          <div className="flex items-center gap-2">
                            <UserAvatar avatar={st.avatar} role="student" size="xs" />
                            <span>{st.name}</span>
                            {isBirthdayToday(st.dob) && (
                              <span title="Birthday Today!" className="text-xs">
                                🎂
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleStudentSubject(st.rollNo, 'english', st.english)}
                            title={`Click to toggle English completion for ${st.name}`}
                            className="p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                          >
                            {st.english ? (
                              <span className="inline-flex items-center justify-center font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md text-xs border border-emerald-200">
                                ✅
                              </span>
                            ) : (
                              <span className="text-slate-300 font-bold px-2 py-0.5 hover:text-slate-500">—</span>
                            )}
                          </button>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleStudentSubject(st.rollNo, 'twau', st.twau)}
                            title={`Click to toggle TWAU completion for ${st.name}`}
                            className="p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                          >
                            {st.twau ? (
                              <span className="inline-flex items-center justify-center font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md text-xs border border-emerald-200">
                                ✅
                              </span>
                            ) : (
                              <span className="text-slate-300 font-bold px-2 py-0.5 hover:text-slate-500">—</span>
                            )}
                          </button>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleStudentSubject(st.rollNo, 'maths', st.maths)}
                            title={`Click to toggle Maths completion for ${st.name}`}
                            className="p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                          >
                            {st.maths ? (
                              <span className="inline-flex items-center justify-center font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md text-xs border border-emerald-200">
                                ✅
                              </span>
                            ) : (
                              <span className="text-slate-300 font-bold px-2 py-0.5 hover:text-slate-500">—</span>
                            )}
                          </button>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleStudentSubject(st.rollNo, 'hindi', st.hindi)}
                            title={`Click to toggle Hindi completion for ${st.name}`}
                            className="p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                          >
                            {st.hindi ? (
                              <span className="inline-flex items-center justify-center font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md text-xs border border-emerald-200">
                                ✅
                              </span>
                            ) : (
                              <span className="text-slate-300 font-bold px-2 py-0.5 hover:text-slate-500">—</span>
                            )}
                          </button>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              id={`teacher-doubt-btn-${st.rollNo}`}
                              onClick={() => onOpenDoubtsForStudent(st.rollNo, st.name)}
                              title={`Chat with ${st.name}`}
                              className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg text-xs font-bold inline-flex items-center gap-1 transition-all cursor-pointer"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Doubt</span>
                            </button>
                            {(st.english || st.twau || st.maths || st.hindi) && (
                              <button
                                id={`teacher-reset-hw-btn-${st.rollNo}`}
                                onClick={() => handleResetStudentCompletions(st.rollNo, st.name)}
                                title={`Delete / Reset done homework for ${st.name}`}
                                className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg text-xs font-bold inline-flex items-center gap-1 transition-all cursor-pointer"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Reset</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* TAB 3: STUDENT DOUBTS (Requirement 8) */}
      {activeTab === 'doubts' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-6 shadow-xl shadow-slate-200/70 border border-slate-100"
        >
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <MessageSquare className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                  Student Doubts & Private Chats
                </h2>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Students ask questions privately. Tap a student conversation to reply.
              </p>
            </div>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white font-black text-xs px-3 py-1 rounded-full animate-bounce">
                {unreadCount} Unread Questions
              </span>
            )}
          </div>

          {doubtThreads.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="text-4xl block mb-2">💬</span>
              <h3 className="text-base font-bold text-slate-800">No student doubts yet</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto font-medium">
                When students in Class 5 ask questions via the portal, they will appear here with red notifications.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {doubtThreads.map((thread) => (
                <motion.div
                  key={thread.rollNo}
                  whileHover={{ scale: 1.01 }}
                  onClick={() => onOpenDoubtsForStudent(thread.rollNo, thread.studentName)}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-4 ${
                    thread.unreadCount > 0
                      ? 'bg-red-50/60 border-red-300 shadow-md shadow-red-500/10'
                      : 'bg-white border-slate-200 hover:border-blue-300 shadow-sm'
                  }`}
                >
                  <div className="flex items-center space-x-3.5">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg shadow-inner ${
                        thread.unreadCount > 0
                          ? 'bg-red-500 text-white animate-pulse'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {thread.rollNo}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-black text-slate-900">
                          {thread.studentName}
                        </h4>
                        <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                          Roll {thread.rollNo}
                        </span>
                        {thread.unreadCount > 0 && (
                          <span className="text-[10px] font-black uppercase bg-red-600 text-white px-2 py-0.5 rounded-full">
                            {thread.unreadCount} New
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 mt-1 line-clamp-1 font-medium">
                        {thread.lastMessage}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      title={`Delete all chat messages with ${thread.studentName}`}
                      onClick={(e) => handleDeleteChatThread(thread.rollNo, thread.studentName, e)}
                      disabled={deletingThreadRoll === thread.rollNo}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-200"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <button className="text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white py-2 px-3.5 sm:px-4 rounded-xl transition-colors shadow-sm">
                      Open Chat →
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* TAB 4: SEND PDF WORKSHEETS (Requirement 3) */}
      {activeTab === 'pdfs' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Upload Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/70 border border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-rose-50 text-rose-600">
                    <FileText className="w-5 h-5" />
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                    Send PDF Worksheets to Class 5
                  </h2>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                  Upload PDF question papers, practice sets, or reading sheets for <strong className="text-slate-800">{subjectConfig?.name}</strong>. Students can view and download them instantly.
                </p>
              </div>

              <span className="text-xs font-bold bg-slate-100 text-slate-700 px-3 py-1.5 rounded-xl self-start sm:self-center">
                Subject: {subjectConfig?.name}
              </span>
            </div>

            <form onSubmit={handleUploadPdf} className="space-y-4">
              {/* File Dropzone Area */}
              <div
                onClick={() => pdfFileInputRef.current?.click()}
                className={`p-6 sm:p-8 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                  selectedFileToUpload
                    ? 'border-rose-400 bg-rose-50/50'
                    : 'border-slate-300 hover:border-rose-400 bg-slate-50 hover:bg-rose-50/30'
                }`}
              >
                <input
                  type="file"
                  accept=".pdf"
                  ref={pdfFileInputRef}
                  onChange={handleSelectPdfFile}
                  className="hidden"
                />

                <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-3 shadow-inner">
                  <Upload className="w-7 h-7" />
                </div>

                {selectedFileToUpload ? (
                  <div className="space-y-1">
                    <p className="text-sm font-black text-rose-900">
                      Selected: {selectedFileToUpload.name}
                    </p>
                    <p className="text-xs text-rose-600 font-bold">
                      Size: {(selectedFileToUpload.size / (1024 * 1024)).toFixed(2)} MB • Click to choose a different PDF
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-800">
                      Click to choose a PDF file or drag & drop here
                    </p>
                    <p className="text-xs text-slate-400">
                      Standard PDF documents up to 25 MB supported
                    </p>
                  </div>
                )}
              </div>

              {/* Title & Options when file is selected */}
              {selectedFileToUpload && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-4 pt-2"
                >
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Worksheet Display Title
                    </label>
                    <input
                      type="text"
                      value={pdfTitleInput}
                      onChange={(e) => setPdfTitleInput(e.target.value)}
                      placeholder="e.g. Chapter 5 Multiplication Practice Sheet"
                      className="w-full p-3.5 bg-slate-50 border border-slate-200 focus:border-rose-500 rounded-xl text-slate-900 text-sm font-medium focus:outline-none transition-all"
                    />
                  </div>

                  <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pdfAttachToHwCheckbox}
                      onChange={(e) => setPdfAttachToHwCheckbox(e.target.checked)}
                      className="w-4 h-4 text-rose-600 rounded focus:ring-rose-500 border-slate-300"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-slate-900">
                        Also attach to today's Class 5 {subjectConfig?.name} homework
                      </span>
                      <p className="text-slate-500 font-medium">
                        Students will see a download button right beneath the homework text.
                      </p>
                    </div>
                  </label>
                </motion.div>
              )}

              {/* Feedback messages */}
              <AnimatePresence>
                {uploadSuccessMsg && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{uploadSuccessMsg}</span>
                  </motion.div>
                )}
                {uploadErrorMsg && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-bold flex items-center gap-2"
                  >
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                    <span>{uploadErrorMsg}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex justify-end pt-2">
                <button
                  id="teacher-upload-pdf-btn"
                  type="submit"
                  disabled={uploadingPdf || !selectedFileToUpload}
                  className="bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 text-white font-black text-sm py-3 px-6 rounded-xl shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  {uploadingPdf ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>Upload & Send PDF</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Uploaded PDF Library */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/70 border border-slate-100">
            <div className="flex items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <span>Uploaded {subjectConfig?.name} Worksheets</span>
                  <span className="text-xs bg-rose-100 text-rose-700 px-2.5 py-0.5 rounded-full font-bold">
                    {pdfFiles.length}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  All PDF files available for students to download.
                </p>
              </div>

              <button
                type="button"
                onClick={loadAllTeacherData}
                className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Refresh worksheets list"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>

            {pdfFiles.length === 0 ? (
              <div className="text-center py-12 px-4 border-2 border-dashed border-slate-200 rounded-2xl">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h4 className="text-base font-black text-slate-700">No PDF Worksheets uploaded yet</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 font-medium">
                  Use the upload box above to send homework question papers, revision sheets, or reading passages to Class 5 students.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pdfFiles.map((file) => {
                  const isAttachedToCurrentHW = hwAttachments.some((att) => att.id === file.id);

                  return (
                    <motion.div
                      key={file.id}
                      layout
                      className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-rose-200 hover:shadow-md transition-all flex flex-col justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2.5 overflow-hidden">
                            <div className="w-9 h-9 rounded-xl bg-rose-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-sm">
                              PDF
                            </div>
                            <div className="overflow-hidden">
                              <h4 className="font-black text-sm text-slate-900 truncate" title={file.title || file.fileName}>
                                {file.title || file.fileName}
                              </h4>
                              <p className="text-[11px] text-slate-400 truncate">{file.fileName}</p>
                            </div>
                          </div>

                          {isAttachedToCurrentHW ? (
                            <span className="text-[10px] font-black uppercase bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full shrink-0">
                              Attached to HW
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full shrink-0">
                              Library Only
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium">
                          <span>Size: {file.fileSizeBytes}</span>
                          <span>•</span>
                          <span>Uploaded: {new Date(file.uploadDate).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {/* Card Action Controls */}
                      <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setViewingPdf(file)}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold flex items-center gap-1 transition-colors cursor-pointer"
                            title="Preview PDF document"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Preview</span>
                          </button>

                          <a
                            href={file.downloadUrl || `/api/files/download/${file.id}`}
                            download={file.fileName}
                            className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl font-bold flex items-center gap-1 transition-colors cursor-pointer"
                            title="Download PDF"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download</span>
                          </a>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleToggleAttachmentToHomework(file)}
                            className={`px-2.5 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
                              isAttachedToCurrentHW
                                ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200'
                                : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                            }`}
                            title={isAttachedToCurrentHW ? 'Remove from today’s homework' : 'Attach to today’s homework'}
                          >
                            {isAttachedToCurrentHW ? 'Detach from HW' : '+ Attach to HW'}
                          </button>

                          <button
                            type="button"
                            disabled={deletingPdfId === file.id}
                            onClick={() => handleDeletePdf(file.id, file.title || file.fileName)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                            title="Delete PDF permanently"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Reusable PDF Document Viewer Modal */}
      {viewingPdf && (
        <PdfViewerModal
          file={viewingPdf}
          onClose={() => setViewingPdf(null)}
        />
      )}

      {/* Reusable Image / Photo Viewer Modal */}
      {viewingImage && (
        <ImageViewerModal
          file={viewingImage}
          onClose={() => setViewingImage(null)}
        />
      )}

      {/* Smriti Ma'am Exclusive Class Passwords Directory Modal */}
      {isSmriti && (
        <ClassPasswordsModal
          isOpen={showClassPasswordsModal}
          onClose={() => setShowClassPasswordsModal(false)}
          teacherName={teacher.name}
        />
      )}

    </div>
  );
};
