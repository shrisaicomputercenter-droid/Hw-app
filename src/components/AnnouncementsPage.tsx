import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bell,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Search,
  Filter,
  ArrowLeft,
  Paperclip,
  Sparkles,
  RefreshCw,
  Megaphone,
  User,
  Clock,
  Pin,
  ExternalLink,
} from 'lucide-react';
import { SchoolAnnouncement, UserSession, PdfDocument } from '../types';
import { api } from '../lib/api';
import { PdfViewerModal } from './PdfViewerModal';
import { ImageViewerModal } from './ImageViewerModal';

interface AnnouncementsPageProps {
  session: UserSession | null;
  onBack: () => void;
  onNavigateToHomework?: () => void;
  onNavigateToCalendar?: () => void;
}

export const AnnouncementsPage: React.FC<AnnouncementsPageProps> = ({
  session,
  onBack,
  onNavigateToHomework,
  onNavigateToCalendar,
}) => {
  const isTeacher = session?.role === 'teacher';
  const isStudent = session?.role === 'student';
  const studentRoll = session?.student?.rollNo;

  const [announcements, setAnnouncements] = useState<SchoolAnnouncement[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Teacher modal / form state
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newContent, setNewContent] = useState<string>('');
  const [newCategory, setNewCategory] = useState<'general' | 'exam' | 'holiday' | 'urgent' | 'homework'>('general');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Attachment viewers
  const [viewingPdf, setViewingPdf] = useState<PdfDocument | null>(null);
  const [viewingImage, setViewingImage] = useState<PdfDocument | null>(null);

  const loadAnnouncements = async () => {
    try {
      const res = await api.getAnnouncements();
      if (res.announcements) {
        setAnnouncements(res.announcements);
        setUnreadCount(res.unreadCount || 0);
      }
    } catch (err) {
      console.error('Failed to load announcements:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnnouncements();
    // Realtime polling like doubt chat
    const interval = setInterval(loadAnnouncements, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await api.createAnnouncement({
        title: newTitle.trim(),
        content: newContent.trim(),
        category: newCategory,
      });

      if (res.success && res.announcement) {
        setAnnouncements((prev) => [res.announcement!, ...prev]);
        setNewTitle('');
        setNewContent('');
        setNewCategory('general');
        setShowCreateModal(false);
        setToastMessage('Announcement posted! Students will now receive it.');
        setTimeout(() => setToastMessage(null), 3500);
      } else {
        alert(res.error || 'Failed to post announcement.');
      }
    } catch (err: any) {
      alert(err?.message || 'Error creating announcement.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    if (!studentRoll) return;
    try {
      // Optimistic update
      setAnnouncements((prev) =>
        prev.map((a) => {
          if (a.id === id) {
            const list = a.readBy || [];
            return { ...a, readBy: list.includes(studentRoll) ? list : [...list, studentRoll] };
          }
          return a;
        })
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      await api.markAnnouncementRead(id, studentRoll);
    } catch (e) {
      console.error('Failed to mark read:', e);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;
    try {
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
      await api.deleteAnnouncement(id);
      setToastMessage('Announcement removed.');
      setTimeout(() => setToastMessage(null), 2500);
    } catch (e) {
      console.error('Failed to delete announcement:', e);
    }
  };

  // Filtered announcements
  const filteredAnnouncements = announcements.filter((a) => {
    if (filterCategory !== 'all' && a.category !== filterCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = a.title.toLowerCase().includes(q);
      const matchContent = a.content.toLowerCase().includes(q);
      const matchAuthor = a.postedBy.toLowerCase().includes(q);
      return matchTitle || matchContent || matchAuthor;
    }
    return true;
  });

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'urgent':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'exam':
        return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      case 'holiday':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'homework':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'urgent':
        return '🚨 Urgent Notice';
      case 'exam':
        return '📝 Exam / Test';
      case 'holiday':
        return '🏖️ Holiday Notice';
      case 'homework':
        return '📚 Homework Alert';
      default:
        return '📢 General Notice';
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-bold border border-slate-700"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

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
          {onNavigateToCalendar && (
            <button
              onClick={onNavigateToCalendar}
              className="text-xs font-bold text-purple-800 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
            >
              📅 Holiday Calendar
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
        className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-orange-950/20 border border-orange-500/40 mb-6 relative overflow-hidden"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-black uppercase tracking-wider text-amber-950 bg-amber-100 px-3 py-0.5 rounded-full border border-amber-300">
                PM SHRI Kendriya Vidyalaya Mandla
              </span>
              <span className="text-xs font-bold text-amber-100">Official Notice Board</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black flex items-center gap-2.5">
              <span>📢 School Announcements</span>
            </h1>

            <p className="text-xs sm:text-sm text-amber-100/90 mt-1 max-w-xl font-medium">
              Teachers post announcements for students. Real-time notifications arrive instantly just like doubts!
            </p>
          </div>

          {/* Action button */}
          {isTeacher ? (
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 bg-white text-orange-900 hover:bg-orange-50 font-black text-xs sm:text-sm py-3 px-5 rounded-2xl shadow-lg transition-all cursor-pointer shrink-0 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4 text-orange-600" />
              <span>Paste New Announcement</span>
            </motion.button>
          ) : (
            isStudent && unreadCount > 0 && (
              <div className="bg-white/20 backdrop-blur-md rounded-2xl px-4 py-2 border border-white/30 text-white text-xs font-bold flex items-center gap-2 shrink-0">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400 animate-ping" />
                <span>{unreadCount} Unread Notice{unreadCount > 1 ? 's' : ''}!</span>
              </div>
            )
          )}
        </div>
      </motion.div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-xl shadow-slate-200/70 border border-slate-100 mb-6 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Category Filter Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-black text-slate-500 uppercase tracking-wider mr-1">
              Filter:
            </span>
            {[
              { id: 'all', label: 'All Notices' },
              { id: 'urgent', label: '🚨 Urgent' },
              { id: 'exam', label: '📝 Exams' },
              { id: 'holiday', label: '🏖️ Holidays' },
              { id: 'homework', label: '📚 Homework' },
              { id: 'general', label: '📢 General' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterCategory(f.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filterCategory === f.id
                    ? 'bg-orange-600 text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search announcements..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>
        </div>
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white rounded-3xl p-12 text-center shadow-md border border-slate-100">
            <RefreshCw className="w-8 h-8 text-orange-500 animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-500 font-bold">Loading notices...</p>
          </div>
        ) : filteredAnnouncements.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center shadow-md border border-slate-100">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-3xl mx-auto mb-3">
              📢
            </div>
            <h3 className="text-lg font-black text-slate-800">No Announcements Found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {isTeacher
                ? 'Click "Paste New Announcement" above to publish circulars for Class 5 students.'
                : 'There are no notices posted in this category currently. Please check back later!'}
            </p>
          </div>
        ) : (
          filteredAnnouncements.map((ann) => {
            const isRead = isStudent && studentRoll && (ann.readBy || []).includes(studentRoll);
            const dateStr = new Date(ann.postedAt).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            });
            const timeStr = new Date(ann.postedAt).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <motion.div
                key={ann.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white rounded-3xl p-5 sm:p-6 shadow-md border transition-all ${
                  isStudent && !isRead
                    ? 'border-2 border-orange-400 ring-4 ring-orange-100/80 shadow-lg'
                    : 'border-slate-100'
                }`}
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-100">
                  <div className="flex items-center flex-wrap gap-2">
                    <span
                      className={`text-xs font-black uppercase px-2.5 py-0.5 rounded-full border shadow-xs ${getCategoryBadge(
                        ann.category
                      )}`}
                    >
                      {getCategoryLabel(ann.category)}
                    </span>

                    {isStudent && !isRead && (
                      <span className="text-[10px] font-black uppercase bg-rose-500 text-white px-2 py-0.5 rounded-full animate-pulse">
                        ✨ New
                      </span>
                    )}

                    <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>{ann.postedBy}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-400 font-medium">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{dateStr} at {timeStr}</span>
                    </span>

                    {isTeacher && (
                      <button
                        onClick={() => handleDeleteAnnouncement(ann.id)}
                        className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-1.5 rounded-xl transition-all cursor-pointer"
                        title="Delete this notice"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Announcement Title & Content */}
                <div className="mt-3">
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 leading-snug">
                    {ann.title}
                  </h3>

                  <div className="mt-2 text-sm sm:text-base text-slate-700 font-normal leading-relaxed whitespace-pre-wrap bg-slate-50/70 p-4 rounded-2xl border border-slate-200/70">
                    {ann.content}
                  </div>
                </div>

                {/* Student Acknowledge / Read button */}
                {isStudent && (
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-medium">
                      {isRead ? '✅ You acknowledged this notice' : '⚠️ Please acknowledge that you have read this notice'}
                    </span>

                    {!isRead ? (
                      <button
                        onClick={() => handleMarkAsRead(ann.id)}
                        className="inline-flex items-center gap-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-xl shadow-xs transition-all cursor-pointer active:scale-95"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Mark as Read</span>
                      </button>
                    ) : (
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                        Read ✓
                      </span>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })
        )}
      </div>

      {/* Teacher Create Announcement Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center text-lg">
                    📢
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900">Paste / Post Announcement</h3>
                    <p className="text-xs text-slate-500">Students will receive it instantly</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateAnnouncement} className="mt-4 space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                    Announcement Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Unit Test 2 Schedule or Holiday Notice"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                    Notice Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
                  >
                    <option value="general">📢 General Notice</option>
                    <option value="exam">📝 Exam / Test Notification</option>
                    <option value="holiday">🏖️ Holiday / Vacation Announcement</option>
                    <option value="urgent">🚨 Urgent Attention Required</option>
                    <option value="homework">📚 Homework Note</option>
                  </select>
                </div>

                {/* Content */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                    Announcement Message / Notice Text *
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder="Paste or type notice message for students here..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm font-normal text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                {/* Submit button */}
                <div className="pt-2 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-black shadow-md transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Posting...' : 'Publish to Students'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
