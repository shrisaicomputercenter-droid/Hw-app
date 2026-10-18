import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, ZoomIn, ZoomOut, RotateCw, ExternalLink } from 'lucide-react';
import { PdfDocument } from '../types';

interface ImageViewerModalProps {
  file: PdfDocument;
  onClose: () => void;
}

export const ImageViewerModal: React.FC<ImageViewerModalProps> = ({ file, onClose }) => {
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const imgSrc = file.dataUrl || file.viewUrl || file.downloadUrl || `/api/files/view/${file.id}`;
  const downloadHref = file.downloadUrl || `/api/files/download/${file.id}`;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-4xl max-h-[92vh] bg-slate-900 rounded-3xl shadow-2xl border border-slate-700/80 flex flex-col overflow-hidden text-white"
        >
          {/* Header */}
          <div className="p-4 sm:px-6 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center space-x-3 overflow-hidden">
              <span className="px-2 py-0.5 rounded-lg bg-blue-600 text-white font-black text-xs uppercase tracking-wider shrink-0">
                PHOTO
              </span>
              <div className="overflow-hidden">
                <h3 className="font-bold text-sm sm:text-base truncate text-slate-100" title={file.title || file.fileName}>
                  {file.title || file.fileName}
                </h3>
                <p className="text-xs text-slate-400">
                  {file.fileSizeBytes} • {file.subjectName || file.subject?.toUpperCase()}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
                className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
                className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setRotation((r) => (r + 90) % 360)}
                className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                title="Rotate"
              >
                <RotateCw className="w-4 h-4" />
              </button>
              <a
                href={downloadHref}
                download={file.fileName}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm ml-1"
                title="Download Image"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Save Image</span>
              </a>
              <button
                type="button"
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer ml-1"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Image Display Area */}
          <div className="flex-1 overflow-auto p-4 sm:p-6 flex items-center justify-center bg-slate-950/60 min-h-[300px]">
            <img
              src={imgSrc}
              alt={file.title || file.fileName}
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
                transition: 'transform 0.2s ease',
              }}
              className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-2xl select-none"
            />
          </div>

          {/* Footer note */}
          <div className="px-5 py-2.5 bg-slate-900/80 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Click &amp; drag or scroll to pan if zoomed in.</span>
            <span>By {file.teacherName}</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
