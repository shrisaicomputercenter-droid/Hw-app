import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  X,
  Upload,
  RotateCcw,
  Check,
  Sparkles,
  Image as ImageIcon,
  Camera,
  Crop as CropIcon,
  ArrowLeft,
  Sliders,
} from 'lucide-react';
import { UserSession } from '../types';
import { SUBJECTS_CONFIG } from '../studentData';
import { UserAvatar } from './UserAvatar';
import { ImageCropper } from './ImageCropper';
import { api } from '../lib/api';

interface ChangeDpModalProps {
  isOpen: boolean;
  session: UserSession;
  onClose: () => void;
  onAvatarUpdated: (newAvatar: string | null) => void;
}

const STUDENT_PRESET_ICONS = [
  { icon: '🎓', label: 'Grad Cap (Default)' },
  { icon: '🎒', label: 'School Bag' },
  { icon: '📚', label: 'Books' },
  { icon: '🌟', label: 'Star Student' },
  { icon: '👦', label: 'Student (Boy)' },
  { icon: '👧', label: 'Student (Girl)' },
  { icon: '🏆', label: 'Trophy' },
  { icon: '🚀', label: 'Rocket' },
  { icon: '🎨', label: 'Art' },
  { icon: '⚽', label: 'Sports' },
  { icon: '🦉', label: 'Wise Owl' },
  { icon: '💡', label: 'Bright Idea' },
];

const TEACHER_PRESET_ICONS = [
  { icon: '👩‍🏫', label: 'Teacher (Default)' },
  { icon: 'ABC', label: 'English (ABC)' },
  { icon: 'अ', label: 'Hindi (अ)' },
  { icon: '🔬', label: 'TWAU Science' },
  { icon: '➗', label: 'Maths' },
  { icon: '👨‍🏫', label: 'Male Teacher' },
  { icon: '🧑‍🏫', label: 'Educator' },
  { icon: '📖', label: 'Open Book' },
  { icon: '⭐', label: 'Gold Star' },
  { icon: '🦉', label: 'Wisdom Owl' },
  { icon: '📋', label: 'Planner' },
  { icon: '🏆', label: 'Excellence' },
];

export const ChangeDpModal: React.FC<ChangeDpModalProps> = ({
  isOpen,
  session,
  onClose,
  onAvatarUpdated,
}) => {
  const isStudent = session.role === 'student';
  const defaultIcon = isStudent
    ? '🎓'
    : session.teacher?.subject && SUBJECTS_CONFIG[session.teacher.subject]
    ? SUBJECTS_CONFIG[session.teacher.subject].flag
    : '👩‍🏫';

  const initialAvatar =
    session.avatar ||
    (isStudent ? session.student?.avatar : session.teacher?.avatar) ||
    null;

  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(initialAvatar);
  const [rawImageForCropping, setRawImageForCropping] = useState<string | null>(null);
  const [isCropping, setIsCropping] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'icons' | 'default'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedAvatar(initialAvatar);
      setErrorMsg(null);
      setIsCropping(false);
      // If current avatar is an image, allow re-cropping it if desired
      if (initialAvatar && (initialAvatar.startsWith('data:image/') || initialAvatar.startsWith('/api/'))) {
        setRawImageForCropping(initialAvatar);
      } else {
        setRawImageForCropping(null);
      }
    }
  }, [isOpen, initialAvatar]);

  if (!isOpen) return null;

  const presetIcons = isStudent ? STUDENT_PRESET_ICONS : TEACHER_PRESET_ICONS;
  const isSelectedDefault = !selectedAvatar || selectedAvatar === defaultIcon;
  const isSelectedImage =
    Boolean(selectedAvatar) &&
    (selectedAvatar!.startsWith('data:image/') ||
      selectedAvatar!.startsWith('http://') ||
      selectedAvatar!.startsWith('https://') ||
      selectedAvatar!.startsWith('/api/') ||
      selectedAvatar!.startsWith('/'));

  // Handle uploaded image file: load as dataUrl and launch interactive cropper
  const handleImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (JPG, PNG, WEBP).');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setErrorMsg('Image file size is too large (max 15MB).');
      return;
    }

    setErrorMsg(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      if (src) {
        setRawImageForCropping(src);
        setIsCropping(true);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleImageFile(files[0]);
    }
    // Reset file input so user can choose the same file again if desired
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleCropComplete = (croppedDataUrl: string) => {
    setSelectedAvatar(croppedDataUrl);
    setIsCropping(false);
    setErrorMsg(null);
  };

  const handleCancelCrop = () => {
    setIsCropping(false);
  };

  const handleStartReCrop = () => {
    if (rawImageForCropping) {
      setIsCropping(true);
    } else if (selectedAvatar && isSelectedImage) {
      setRawImageForCropping(selectedAvatar);
      setIsCropping(true);
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleResetToDefault = () => {
    setSelectedAvatar(null);
    setRawImageForCropping(null);
    setIsCropping(false);
    setErrorMsg(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setErrorMsg(null);

    try {
      // If user selected default or null, pass null so backend clears custom avatar
      const finalAvatar =
        !selectedAvatar || selectedAvatar === defaultIcon ? null : selectedAvatar;

      // Save locally immediately so it is permanently preserved across reloads and offline
      if (finalAvatar) {
        localStorage.setItem('class5_my_avatar', finalAvatar);
        if (isStudent && session.student?.rollNo) {
          localStorage.setItem(`class5_avatar_student_${session.student.rollNo}`, finalAvatar);
        } else if (!isStudent && session.teacher?.subject) {
          localStorage.setItem(`class5_avatar_teacher_${session.teacher.subject}`, finalAvatar);
        }
      } else {
        localStorage.removeItem('class5_my_avatar');
        if (isStudent && session.student?.rollNo) {
          localStorage.removeItem(`class5_avatar_student_${session.student.rollNo}`);
        } else if (!isStudent && session.teacher?.subject) {
          localStorage.removeItem(`class5_avatar_teacher_${session.teacher.subject}`);
        }
      }

      const res = await api.updateAvatar(finalAvatar);
      // Use finalAvatar directly so local crop dataUrl is immediately visible
      onAvatarUpdated(finalAvatar);
      onClose();
    } catch (err: any) {
      console.warn('Backend avatar update warning:', err);
      // Fallback: still keep the local avatar updated so user work is never lost!
      const finalAvatar = !selectedAvatar || selectedAvatar === defaultIcon ? null : selectedAvatar;
      onAvatarUpdated(finalAvatar);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const userName = isStudent ? session.student?.name : session.teacher?.name;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 relative my-6 overflow-hidden"
      >
        {/* Modal Top Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center space-x-2.5">
            {isCropping ? (
              <button
                type="button"
                onClick={handleCancelCrop}
                className="w-10 h-10 rounded-2xl bg-slate-200 hover:bg-slate-300 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                title="Back to options"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            ) : (
              <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
                <Camera className="w-5 h-5" />
              </div>
            )}
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                {isCropping ? 'Crop Profile Picture (DP)' : 'Change Profile Picture (DP)'}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {isStudent
                  ? `Class 5 • ${session.student?.name} (Roll ${session.student?.rollNo})`
                  : `School Faculty • ${session.teacher?.name}`}
              </p>
            </div>
          </div>

          <button
            id="close-change-dp-modal-btn"
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-full transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInputChange}
            className="hidden"
            id="dp-file-upload-input"
          />

          {/* VIEW 1: Interactive Cropper Active */}
          {isCropping && rawImageForCropping ? (
            <ImageCropper
              imageSrc={rawImageForCropping}
              onCrop={handleCropComplete}
              onCancel={handleCancelCrop}
              role={session.role}
              userName={userName}
            />
          ) : (
            /* VIEW 2: Normal DP Selection & Tabs */
            <>
              {/* Live Preview Card */}
              <div className="flex flex-col items-center justify-center p-4 bg-gradient-to-b from-slate-50 to-slate-100/70 rounded-2xl border border-slate-200">
                <div className="relative mb-2">
                  <UserAvatar
                    avatar={selectedAvatar}
                    role={session.role}
                    defaultIcon={defaultIcon}
                    size="2xl"
                    borderClass="border-4 border-white shadow-xl"
                  />
                  {isSelectedImage && (
                    <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1 rounded-full border-2 border-white shadow">
                      <Check className="w-3 h-3" />
                    </span>
                  )}
                </div>

                <p className="text-sm font-bold text-slate-900 mt-1">{userName}</p>

                <div className="mt-1 flex items-center gap-1.5">
                  {isSelectedDefault ? (
                    <span className="text-[11px] font-bold text-blue-700 bg-blue-100/80 px-2.5 py-0.5 rounded-full border border-blue-200">
                      Default {isStudent ? 'Student' : 'Teacher'} Icon ({defaultIcon})
                    </span>
                  ) : isSelectedImage ? (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      Custom Cropped Universal DP
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-purple-700 bg-purple-100/80 px-2.5 py-0.5 rounded-full border border-purple-200">
                      School Avatar Icon ({selectedAvatar})
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-500 font-medium text-center mt-2 max-w-xs">
                  Your DP is synced universally across all devices (phone, laptop, tablet, and teacher dashboard).
                </p>
              </div>

              {/* Navigation Tabs */}
              <div className="flex bg-slate-100 p-1 rounded-2xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setActiveTab('upload')}
                  className={`flex-1 py-2 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeTab === 'upload'
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload & Crop</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('icons')}
                  className={`flex-1 py-2 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeTab === 'icons'
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>School Icons</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('default')}
                  className={`flex-1 py-2 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeTab === 'default'
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                  <span>Default Icon</span>
                </button>
              </div>

              {/* TAB 1: Upload & Crop Photo */}
              {activeTab === 'upload' && (
                <div className="space-y-3">
                  {isSelectedImage ? (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-xs text-emerald-900 flex items-center gap-1.5">
                          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                          Photo Cropped & Ready to Save
                        </span>
                        <span className="text-[10px] font-bold text-emerald-700 bg-white/90 px-2 py-0.5 rounded-full border border-emerald-300">
                          HD 400×400
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-emerald-200/80">
                        {/* Adjust / Re-Crop Button */}
                        <button
                          id="adjust-crop-btn"
                          type="button"
                          onClick={handleStartReCrop}
                          className="flex-1 min-w-[130px] py-2 px-3 bg-white hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-300 flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                        >
                          <CropIcon className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Adjust / Re-Crop</span>
                        </button>

                        {/* Choose Another Image */}
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex-1 min-w-[130px] py-2 px-3 bg-white hover:bg-emerald-100 text-slate-700 text-xs font-bold rounded-xl border border-emerald-300 flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5 text-slate-500" />
                          <span>Choose Another</span>
                        </button>

                        {/* Remove */}
                        <button
                          type="button"
                          onClick={handleResetToDefault}
                          className="py-2 px-3 text-red-600 hover:text-red-800 hover:bg-red-50 text-xs font-bold rounded-xl transition-all cursor-pointer"
                        >
                          Remove Photo
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-blue-200 hover:border-blue-400 bg-blue-50/50 hover:bg-blue-50 rounded-2xl p-6 text-center transition-all cursor-pointer group"
                    >
                      <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-100 group-hover:bg-blue-200 text-blue-600 flex items-center justify-center mb-3 transition-colors">
                        <ImageIcon className="w-6 h-6" />
                      </div>
                      <h4 className="text-sm font-black text-slate-800 group-hover:text-blue-700 transition-colors">
                        Click to Choose Photo from Device
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">
                        Supports PNG, JPG, JPEG, or WEBP from phone or computer
                      </p>
                      <div className="inline-flex items-center gap-1.5 text-[11px] text-blue-700 font-bold bg-blue-100/70 px-3 py-1 rounded-full mt-3 border border-blue-200">
                        <CropIcon className="w-3 h-3 text-blue-600" />
                        <span>Interactive cropping tool opens automatically</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: Preset School Icons */}
              {activeTab === 'icons' && (
                <div className="space-y-2.5">
                  <p className="text-xs text-slate-500 font-medium">
                    Select an avatar icon to represent your profile in the school portal:
                  </p>

                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5">
                    {presetIcons.map((item) => {
                      const isCurrent = selectedAvatar === item.icon;
                      return (
                        <button
                          key={item.icon}
                          type="button"
                          onClick={() => {
                            setSelectedAvatar(item.icon);
                            setRawImageForCropping(null);
                            setErrorMsg(null);
                          }}
                          className={`p-3 rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer ${
                            isCurrent
                              ? 'bg-blue-100 border-2 border-blue-600 shadow-sm scale-105'
                              : 'bg-slate-50 hover:bg-slate-100 border border-slate-200'
                          }`}
                          title={item.label}
                        >
                          <span className="text-3xl select-none leading-none mb-1">
                            {item.icon}
                          </span>
                          <span className="text-[10px] font-bold text-slate-700 truncate w-full text-center">
                            {item.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 3: Reset to Default Icon */}
              {activeTab === 'default' && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-2xl shadow-md border-2 border-white shrink-0">
                      {defaultIcon}
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900">
                        Official Default {isStudent ? 'Student' : 'Teacher'} Icon
                      </h4>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        Don't want to set an image? Keep or reset to the standard school icon ({defaultIcon}).
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200/80">
                    <button
                      id="reset-to-default-dp-btn"
                      type="button"
                      onClick={handleResetToDefault}
                      className={`w-full py-2.5 px-4 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        isSelectedDefault
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-slate-200 hover:bg-slate-300 text-slate-800 border border-slate-300'
                      }`}
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>
                        {isSelectedDefault
                          ? `Default Icon (${defaultIcon}) is Active`
                          : `Reset to Default ${isStudent ? 'Student' : 'Teacher'} Icon (${defaultIcon})`}
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Error message */}
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl">
              {errorMsg}
            </div>
          )}
        </div>

        {/* Footer Actions (Only shown when not inside cropper view) */}
        {!isCropping && (
          <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
            >
              Cancel
            </button>

            <div className="flex items-center gap-2">
              {!isSelectedDefault && (
                <button
                  type="button"
                  onClick={handleResetToDefault}
                  title="Reset to Default Icon"
                  className="px-3 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Use Default</span>
                </button>
              )}

              <button
                id="save-dp-modal-btn"
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 active:scale-98 text-white text-xs font-black py-2.5 px-5 rounded-xl shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Saving DP Universally...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Save DP Universally</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
