import React, { useState, useEffect } from 'react';
import { Camera } from 'lucide-react';

export interface UserAvatarProps {
  avatar?: string | null;
  role: 'student' | 'teacher';
  defaultIcon?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  borderClass?: string;
  showCameraBadge?: boolean;
  onCameraClick?: () => void;
  onClick?: () => void;
  title?: string;
  id?: string;
}

const SIZE_CLASSES = {
  xs: 'w-6 h-6 text-xs rounded-md',
  sm: 'w-8 h-8 text-sm rounded-lg',
  md: 'w-10 h-10 text-base rounded-xl',
  lg: 'w-12 h-12 text-xl rounded-xl',
  xl: 'w-16 h-16 text-3xl rounded-2xl',
  '2xl': 'w-20 h-20 text-4xl rounded-3xl',
};

const CAMERA_BADGE_SIZES = {
  xs: 'w-2.5 h-2.5 p-0.5 -bottom-0.5 -right-0.5',
  sm: 'w-3.5 h-3.5 p-0.5 -bottom-0.5 -right-0.5',
  md: 'w-4 h-4 p-0.5 -bottom-0.5 -right-0.5',
  lg: 'w-5 h-5 p-1 -bottom-1 -right-1',
  xl: 'w-6 h-6 p-1.5 -bottom-1 -right-1',
  '2xl': 'w-7 h-7 p-1.5 -bottom-1 -right-1',
};

const CAMERA_ICON_SIZES = {
  xs: 'w-2 h-2',
  sm: 'w-2.5 h-2.5',
  md: 'w-3 h-3',
  lg: 'w-3.5 h-3.5',
  xl: 'w-4 h-4',
  '2xl': 'w-4 h-4',
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
  avatar,
  role,
  defaultIcon: customDefaultIcon,
  size = 'md',
  className = '',
  borderClass = 'border-2 border-white',
  showCameraBadge = false,
  onCameraClick,
  onClick,
  title,
  id,
}) => {
  const [imageError, setImageError] = useState(false);

  // Reset error whenever avatar changes
  useEffect(() => {
    setImageError(false);
  }, [avatar]);

  const isStudent = role === 'student';
  const defaultIcon = customDefaultIcon || (isStudent ? '🎓' : '👩‍🏫');

  // If this is the editable user avatar (showCameraBadge), fallback to cached local avatar if missing
  const effectiveAvatar =
    avatar ||
    (showCameraBadge && typeof window !== 'undefined'
      ? localStorage.getItem('class5_my_avatar')
      : null) ||
    '';

  const isImageUrl =
    Boolean(effectiveAvatar) &&
    !imageError &&
    (effectiveAvatar.startsWith('data:image/') ||
      effectiveAvatar.startsWith('http://') ||
      effectiveAvatar.startsWith('https://') ||
      effectiveAvatar.startsWith('/api/') ||
      effectiveAvatar.startsWith('/'));

  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.md;
  const cameraBadgeSize = CAMERA_BADGE_SIZES[size] || CAMERA_BADGE_SIZES.md;
  const cameraIconSize = CAMERA_ICON_SIZES[size] || CAMERA_ICON_SIZES.md;

  const bgGradient = isStudent
    ? 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white'
    : 'bg-gradient-to-tr from-emerald-600 to-teal-600 text-white';

  const defaultTitle = title || (isStudent ? 'Student Profile' : 'Teacher Profile');

  return (
    <div
      id={id}
      title={defaultTitle}
      onClick={onClick || onCameraClick}
      className={`relative inline-flex shrink-0 select-none ${
        onClick || onCameraClick ? 'cursor-pointer group' : ''
      }`}
    >
      <div
        className={`flex items-center justify-center overflow-hidden font-black transition-all ${sizeClass} ${borderClass} ${
          isImageUrl ? 'bg-slate-100 text-slate-800' : bgGradient
        } ${className}`}
      >
        {isImageUrl ? (
          <img
            src={effectiveAvatar}
            alt={defaultTitle}
            crossOrigin="anonymous"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover rounded-[inherit]"
            onError={() => setImageError(true)}
          />
        ) : (
          <span
            className={`leading-none select-none font-black ${
              effectiveAvatar && effectiveAvatar.trim().length > 2
                ? 'text-[0.55em] tracking-tight font-black'
                : ''
            }`}
          >
            {effectiveAvatar && effectiveAvatar.trim() ? effectiveAvatar : defaultIcon}
          </span>
        )}
      </div>

      {showCameraBadge && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (onCameraClick) onCameraClick();
            else if (onClick) onClick();
          }}
          title="Change DP / Profile Picture"
          className={`absolute ${cameraBadgeSize} bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-md border-2 border-white flex items-center justify-center transition-transform group-hover:scale-110 cursor-pointer`}
        >
          <Camera className={cameraIconSize} />
        </button>
      )}
    </div>
  );
};
