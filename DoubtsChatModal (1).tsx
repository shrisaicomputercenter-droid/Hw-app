import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Send,
  User,
  MessageSquare,
  Clock,
  CheckCheck,
  BookOpen,
  Trash2,
  Paperclip,
  FileText,
  Download,
  Eye,
} from 'lucide-react';
import { DoubtMessage, SubjectKey, UserSession, PdfDocument } from '../types';
import { SUBJECTS_CONFIG, SUBJECT_ORDER } from '../studentData';
import { api } from '../lib/api';
import { PdfViewerModal } from './PdfViewerModal';
import { UserAvatar } from './UserAvatar';

interface DoubtsChatModalProps {
  session: UserSession;
  targetStudentRoll?: number | null;
  targetStudentName?: string | null;
  initialSubject?: SubjectKey | null;
  onClose: () => void;
  onRefreshDoubts?: () => void;
}

export const DoubtsChatModal: React.FC<DoubtsChatModalProps> = ({
  session,
  targetStudentRoll,
  targetStudentName,
  initialSubject,
  onClose,
  onRefreshDoubts,
}) => {
  const isStudent = session.role === 'student';
  const effectiveRoll = isStudent ? session.student?.rollNo : targetStudentRoll;
  const effectiveName = isStudent ? session.student?.name : (targetStudentName || `Roll ${targetStudentRoll}`);

  const [selectedSubject, setSelectedSubject] = useState<SubjectKey>(
    initialSubject || (isStudent ? 'english' : (session.teacher?.subject || 'english'))
  );

  const activeSubject: SubjectKey = isStudent ? selectedSubject : (session.teacher?.subject || 'english');

  const [messages, setMessages] = useState<DoubtMessage[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [sending, setSending] = useState<boolean>(false);
  const [avatarsMap, setAvatarsMap] = useState<{ students: Record<string, string>; teachers: Record<string, string> }>({
    students: {},
    teachers: {},
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [clearing, setClearing] = useState<boolean>(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [attachedPdf, setAttachedPdf] = useState<{
    file: File;
    dataUrl: string;
    title: string;
  } | null>(null);
  const [viewingPdf, setViewingPdf] = useState<PdfDocument | null>(null);
  const [chatError, setChatError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync initialSubject if prop updates
  useEffect(() => {
    if (initialSubject) {
      setSelectedSubject(initialSubject);
    }
  }, [initialSubject]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async () => {
    if (!effectiveRoll) return;
    try {
      // If student, load all student doubts so unread badges on tabs can be calculated
      // If teacher, backend automatically isolates strictly to teacher's subject
      const data = await api.getDoubts(effectiveRoll, isStudent ? undefined : activeSubject);
      if (data?.messages) {
        setMessages(data.messages);
      }
      // Mark as read for this active subject
      await api.markDoubtsRead(effectiveRoll, activeSubject);
      if (onRefreshDoubts) onRefreshDoubts();
    } catch (err) {
      console.error('Failed to load doubt messages:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
    api.getAllAvatars().then((res) => {
      if (res) setAvatarsMap(res);
    }).catch(() => {});
    const interval = setInterval(loadMessages, 4000); // 4-second polling for active chat
    return () => clearInterval(interval);
  }, [effectiveRoll, activeSubject]);

  // Mark read when student switches subject tab
  useEffect(() => {
    if (effectiveRoll && isStudent) {
      api.markDoubtsRead(effectiveRoll, activeSubject).then(() => {
        if (onRefreshDoubts) onRefreshDoubts();
      }).catch(() => {});
    }
  }, [activeSubject, effectiveRoll, isStudent]);

  // Filter messages to strictly the active teacher subject
  const displayedMessages = messages.filter((m) => m.subject === activeSubject);

  useEffect(() => {
    scrollToBottom();
  }, [displayedMessages.length]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      alert('Please select a valid PDF file.');
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      alert('PDF file size must be under 25MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const cleanTitle = file.name.replace(/\.pdf$/i, '').replace(/[-_]/g, ' ');
      setAttachedPdf({
        file,
        dataUrl,
        title: cleanTitle,
      });
    };
    reader.readAsDataURL(file);
    // Reset file input value so same file can be re-selected if needed
    e.target.value = '';
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!inputText.trim() && !attachedPdf) || sending) return;

    const text = inputText.trim() || (attachedPdf ? `Shared PDF Worksheet: ${attachedPdf.title}` : '');
    setInputText('');
    setSending(true);
    setChatError(null);

    try {
      let uploadedDoc: PdfDocument | undefined = undefined;

      if (attachedPdf) {
        const uploadRes = await api.uploadPdf({
          fileName: attachedPdf.file.name,
          title: attachedPdf.title,
          subject: activeSubject,
          dataUrl: attachedPdf.dataUrl,
          attachToHomework: false,
        });

        if (uploadRes.success && uploadRes.file) {
          uploadedDoc = uploadRes.file;
        }
      }

      const res = await api.sendDoubt(text, activeSubject, effectiveRoll || undefined, uploadedDoc);
      if (res.success && res.message) {
        setMessages((prev) => [...prev, res.message!]);
        setAttachedPdf(null);
        scrollToBottom();
        if (onRefreshDoubts) onRefreshDoubts();
      } else {
        setChatError(res.error || "Oops! Could not catch network. Please check your internet connection.");
      }
    } catch (err) {
      console.error('Failed to send doubt message:', err);
      setChatError("Oops! Could not catch network. Please check your internet connection.");
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (deletingId) return;
    setDeletingId(messageId);
    try {
      const res = await api.deleteDoubtMessage(messageId);
      if (res.success) {
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
        if (onRefreshDoubts) onRefreshDoubts();
      }
    } catch (err) {
      console.error('Failed to delete message:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleClearAllChat = async () => {
    if (!effectiveRoll || clearing) return;
    const currentCfg = SUBJECTS_CONFIG[activeSubject];
    const confirmClear = window.confirm(
      isStudent
        ? `Are you sure you want to delete and clear all chat history with ${currentCfg?.teacherName} (${currentCfg?.name})?`
        : `Are you sure you want to delete and clear all ${currentCfg?.name} chat messages for ${effectiveName}?`
    );
    if (!confirmClear) return;

    setClearing(true);
    try {
      const res = await api.clearDoubtThread(effectiveRoll, activeSubject);
      if (res.success) {
        setMessages((prev) => prev.filter((m) => m.subject !== activeSubject));
        if (onRefreshDoubts) onRefreshDoubts();
      }
    } catch (err) {
      console.error('Failed to clear chat thread:', err);
    } finally {
      setClearing(false);
    }
  };

  const currentTeacherCfg = SUBJECTS_CONFIG[activeSubject];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-white rounded-3xl w-full max-w-2xl h-[90vh] max-h-[700px] flex flex-col shadow-2xl overflow-hidden border border-slate-200"
      >
        {/* Chat Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 text-white p-4 sm:p-5 flex items-center justify-between shadow-md shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 bg-yellow-400 text-blue-950 rounded-2xl flex items-center justify-center text-xl font-black shadow-inner">
              💬
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-wide">
                  {isStudent ? 'Ask Teacher a Doubt' : `Private Chat: ${effectiveName}`}
                </h3>
                <span className="text-[11px] font-bold bg-white/20 text-yellow-300 px-2 py-0.5 rounded-full">
                  Roll {effectiveRoll}
                </span>
              </div>
              <p className="text-xs text-blue-200 font-medium">
                {isStudent
                  ? 'Private 1-on-1 discussion with your Class 5 Teachers'
                  : `${currentTeacherCfg?.name} Faculty: ${session.teacher?.name}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {displayedMessages.length > 0 && (
              <button
                id="clear-doubt-thread-btn"
                onClick={handleClearAllChat}
                disabled={clearing}
                title="Clear and delete messages for this teacher"
                className="p-2 text-rose-300 hover:text-white hover:bg-red-600/30 rounded-xl transition-all flex items-center gap-1 text-xs font-bold cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Clear Chat</span>
              </button>
            )}
            <button
              id="close-chat-modal-btn"
              onClick={onClose}
              className="p-2 text-blue-200 hover:text-white hover:bg-white/10 rounded-xl transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Teacher View Bar: Confirms strictly private to this subject teacher */}
        {!isStudent && (
          <div className="bg-blue-50/90 px-4 py-2 border-b border-blue-200/80 flex items-center justify-between text-xs shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-base">{currentTeacherCfg?.flag}</span>
              <span className="font-black text-slate-800">{currentTeacherCfg?.name} Doubts</span>
              <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
                • Only you ({session.teacher?.name}) see these doubts
              </span>
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full">
              🔒 Private to you
            </span>
          </div>
        )}

        {/* Subject Selector for Student */}
        {isStudent && (
          <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex flex-col gap-1.5 shrink-0">
            <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
              <span className="text-xs font-bold text-slate-500 whitespace-nowrap">
                Ask Teacher:
              </span>
              {SUBJECT_ORDER.map((key) => {
                const cfg = SUBJECTS_CONFIG[key];
                const isSelected = selectedSubject === key;
                const unreadCountForSubj = messages.filter(
                  (m) => m.subject === key && m.senderRole === 'teacher' && !m.readByStudent
                ).length;

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedSubject(key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-400/40'
                        : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    <span>{cfg.flag}</span>
                    <span>{cfg.name}</span>
                    {unreadCountForSubj > 0 && (
                      <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-black animate-pulse">
                        {unreadCountForSubj}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="text-[11px] text-slate-500 font-medium flex flex-wrap items-center justify-between gap-1 pt-0.5 border-t border-slate-200/60">
              <span className="truncate">
                Teacher: <strong className="text-blue-900 font-bold">{currentTeacherCfg?.teacherName}</strong>
              </span>
              <span className="text-[10px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-bold shrink-0">
                🔒 Only {currentTeacherCfg?.name} Teacher sees this
              </span>
            </div>
          </div>
        )}

        {/* Messages Body */}
        <div className="flex-1 p-4 sm:p-5 overflow-y-auto bg-slate-50/60 space-y-3">
          {loading ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
              Loading conversation...
            </div>
          ) : displayedMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-3xl flex items-center justify-center text-3xl mb-3 shadow-inner">
                {currentTeacherCfg?.flag || '💡'}
              </div>
              <h4 className="text-sm font-bold text-slate-700">
                {isStudent
                  ? `No questions sent to ${currentTeacherCfg?.teacherName} yet`
                  : `No questions from ${effectiveName} for ${currentTeacherCfg?.name} yet`}
              </h4>
              <p className="text-xs text-slate-500 max-w-xs mt-1">
                {isStudent
                  ? `Type your question below. It will be sent directly to ${currentTeacherCfg?.teacherName} (${currentTeacherCfg?.name})!`
                  : `When ${effectiveName} asks a question for ${currentTeacherCfg?.name}, it will appear here.`}
              </p>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {displayedMessages.map((msg) => {
                const isMe = msg.senderRole === session.role;
                const formattedTime = new Date(msg.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                });

                const senderAvatar =
                  msg.senderRole === 'teacher'
                    ? (msg.subject ? avatarsMap.teachers[msg.subject] : null) || (session.role === 'teacher' && msg.senderRole === 'teacher' ? session.avatar : null)
                    : (avatarsMap.students[msg.studentRoll?.toString() || ''] || (session.role === 'student' && msg.senderRole === 'student' ? session.avatar : null));

                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, height: 0 }}
                    className={`flex flex-col group ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    {/* Sender Badge */}
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold mb-1 px-1">
                      <UserAvatar
                        avatar={senderAvatar}
                        role={msg.senderRole}
                        defaultIcon={
                          msg.senderRole === 'teacher' && msg.subject && (SUBJECTS_CONFIG as any)[msg.subject]
                            ? (SUBJECTS_CONFIG as any)[msg.subject].flag
                            : undefined
                        }
                        size="xs"
                      />
                      <span>
                        {msg.senderRole === 'teacher' ? (msg.teacherName || 'Teacher') : msg.studentName}
                      </span>
                      {msg.subject && (
                        <span className="bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-semibold uppercase">
                          {msg.subject}
                        </span>
                      )}
                    </div>

                    {/* Message Bubble + Delete Button Container */}
                    <div className="flex items-center gap-1.5 max-w-[88%] sm:max-w-[78%]">
                      {isMe && (
                        <button
                          onClick={() => handleDeleteMessage(msg.id)}
                          disabled={deletingId === msg.id}
                          title="Delete message"
                          className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <div
                        className={`p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm w-full ${
                          isMe
                            ? 'bg-blue-600 text-white rounded-tr-none'
                            : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                        }`}
                      >
                        <p className="whitespace-pre-wrap font-medium">{msg.message}</p>

                        {/* File Attachment Card in Message */}
                        {msg.fileAttachment && (
                          <div
                            className={`mt-2.5 p-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs ${
                              isMe
                                ? 'bg-blue-700/80 border-blue-500/80 text-white'
                                : 'bg-rose-50 border-rose-200 text-slate-900'
                            }`}
                          >
                            <div className="flex items-center space-x-2 overflow-hidden">
                              <span className="px-1.5 py-0.5 bg-rose-600 text-white font-black text-[9px] rounded">
                                PDF
                              </span>
                              <div className="overflow-hidden">
                                <p className="font-bold truncate max-w-[140px] sm:max-w-[180px]" title={msg.fileAttachment.title || msg.fileAttachment.fileName}>
                                  {msg.fileAttachment.title || msg.fileAttachment.fileName}
                                </p>
                                <span className={`text-[10px] ${isMe ? 'text-blue-200' : 'text-slate-500'}`}>
                                  {msg.fileAttachment.fileSizeBytes}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => setViewingPdf(msg.fileAttachment!)}
                                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                  isMe ? 'bg-blue-800 hover:bg-blue-900 text-white' : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                                }`}
                                title="View PDF"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <a
                                href={msg.fileAttachment.downloadUrl || `/api/files/download/${msg.fileAttachment.id}`}
                                download={msg.fileAttachment.fileName}
                                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold flex items-center gap-1 transition-colors cursor-pointer"
                                title="Download PDF"
                              >
                                <Download className="w-3 h-3" />
                                <span className="hidden sm:inline">Download</span>
                              </a>
                            </div>
                          </div>
                        )}

                        <div
                          className={`flex items-center justify-end gap-1 text-[10px] mt-1 font-semibold ${
                            isMe ? 'text-blue-200' : 'text-slate-400'
                          }`}
                        >
                          <Clock className="w-2.5 h-2.5" />
                          <span>{formattedTime}</span>
                        </div>
                      </div>

                      {!isMe && session.role === 'teacher' && (
                        <button
                          onClick={() => handleDeleteMessage(msg.id)}
                          disabled={deletingId === msg.id}
                          title="Delete message"
                          className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Pending PDF Attachment Preview Strip */}
        {attachedPdf && (
          <div className="px-4 py-2 bg-rose-50 border-t border-rose-200 flex items-center justify-between text-xs text-rose-900 shrink-0">
            <div className="flex items-center space-x-2 overflow-hidden">
              <span className="px-1.5 py-0.5 bg-rose-600 text-white font-black text-[9px] rounded">
                PDF ATTACHED
              </span>
              <span className="font-bold truncate">{attachedPdf.title}</span>
              <span className="text-[10px] text-rose-600 shrink-0">
                ({(attachedPdf.file.size / 1024).toFixed(1)} KB)
              </span>
            </div>
            <button
              type="button"
              onClick={() => setAttachedPdf(null)}
              className="text-slate-400 hover:text-rose-700 p-1 rounded-md transition-colors cursor-pointer"
              title="Remove attachment"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Error notification banner */}
        {chatError && (
          <div className="px-4 py-2 bg-rose-100 border-t border-rose-300 flex items-center justify-between text-xs text-rose-800 shrink-0">
            <span className="font-semibold">{chatError}</span>
            <button
              type="button"
              onClick={() => setChatError(null)}
              className="text-rose-600 hover:text-rose-900 p-1 rounded-md"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Message Input Footer */}
        <form onSubmit={handleSend} className="p-3 sm:p-4 bg-white border-t border-slate-200 shrink-0">
          <div className="flex items-center gap-2">
            <input
              type="file"
              accept=".pdf"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />

            <button
              type="button"
              id="doubt-attach-pdf-btn"
              onClick={() => fileInputRef.current?.click()}
              title="Attach PDF file"
              className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                attachedPdf
                  ? 'bg-rose-100 border-rose-400 text-rose-700'
                  : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-600'
              }`}
            >
              <Paperclip className="w-4 h-4" />
            </button>

            <input
              id="doubt-chat-input"
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                attachedPdf
                  ? 'Add optional note or click Send...'
                  : isStudent
                  ? `Ask question to ${currentTeacherCfg?.teacherName} (${currentTeacherCfg?.name})...`
                  : `Reply to ${effectiveName} for ${currentTeacherCfg?.name}...`
              }
              className="flex-1 py-3 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-900 focus:outline-none focus:border-blue-600 transition-all shadow-inner"
            />

            <motion.button
              id="send-doubt-chat-btn"
              whileTap={{ scale: 0.95 }}
              type="submit"
              disabled={sending || (!inputText.trim() && !attachedPdf)}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white p-3 sm:px-5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 transition-all shrink-0 cursor-pointer"
            >
              {sending ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span className="hidden sm:inline">Send</span>
                  <Send className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </div>
        </form>
      </motion.div>

      {/* PDF Document Viewer Modal */}
      {viewingPdf && (
        <PdfViewerModal
          file={viewingPdf}
          onClose={() => setViewingPdf(null)}
        />
      )}
    </div>
  );
};
