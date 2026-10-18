import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, ExternalLink, FileText } from 'lucide-react';
import { PdfDocument } from '../types';

interface PdfViewerModalProps {
  file: PdfDocument | null;
  onClose: () => void;
}

export const PdfViewerModal: React.FC<PdfViewerModalProps> = ({ file, onClose }) => {
  if (!file) return null;

  return (
    <AnimatePresence>
      <div
        id="pdf-viewer-backdrop"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/80 backdrop-blur-sm"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden"
        >
          {/* Header Bar */}
          <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center space-x-3 overflow-hidden">
              <div className="w-10 h-10 rounded-xl bg-rose-600 flex items-center justify-center text-white shrink-0 font-black text-xs shadow-md">
                PDF
              </div>
              <div className="overflow-hidden">
                <h3 className="text-base sm:text-lg font-black truncate text-white" title={file.title || file.fileName}>
                  {file.title || file.fileName}
                </h3>
                <p className="text-xs text-slate-300 font-medium">
                  {file.subjectName || file.subject.toUpperCase()} • {file.fileSizeBytes} • By {file.teacherName}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2 shrink-0">
              <a
                href={file.downloadUrl || `/api/files/download/${file.id}`}
                download={file.fileName}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                title="Download PDF to device"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Download PDF</span>
              </a>

              <a
                href={file.viewUrl || `/api/files/view/${file.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs p-2 sm:px-3 sm:py-2 rounded-xl flex items-center gap-1.5 transition-all"
                title="Open in new tab"
              >
                <ExternalLink className="w-4 h-4" />
                <span className="hidden md:inline">Open New Tab</span>
              </a>

              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Embedded PDF iframe */}
          <div className="flex-1 bg-slate-100 p-2 sm:p-4 overflow-hidden relative">
            <iframe
              src={file.viewUrl || `/api/files/view/${file.id}#toolbar=1`}
              title={file.fileName}
              className="w-full h-full rounded-2xl border border-slate-300 bg-white shadow-inner"
            />
          </div>

          {/* Footer Notice */}
          <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-medium">
              <FileText className="w-4 h-4 text-rose-600" />
              <span>PM SHRI Kendriya Vidyalaya Mandla — Class 5 Study Resource</span>
            </div>
            <a
              href={file.downloadUrl || `/api/files/download/${file.id}`}
              download={file.fileName}
              className="text-rose-600 hover:text-rose-700 font-bold underline cursor-pointer"
            >
              Click here if preview does not load
            </a>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
