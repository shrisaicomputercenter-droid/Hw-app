import React from 'react';
import { User, School, LogOut, WifiOff, RefreshCw } from 'lucide-react';
import { UserSession } from '../types';
import { SUBJECTS_CONFIG } from '../studentData';
import { UserAvatar } from './UserAvatar';
import { useNetworkStatus } from '../lib/networkStatus';

interface HeaderProps {
  session: UserSession | null;
  onOpenProfile: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ session, onOpenProfile, onLogout }) => {
  const { isDisconnected, isChecking, retry } = useNetworkStatus();

  return (
    <header
      className="w-full bg-blue-900 text-white shadow-md border-b-2 border-blue-950 sticky top-0 z-30"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* School / Class 5 Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 bg-gradient-to-br from-yellow-400 to-amber-500 text-blue-950 rounded-xl flex items-center justify-center shadow-inner font-black text-xl border-2 border-yellow-300 shrink-0">
            🏫
          </div>
          <div>
            <div className="flex items-center flex-wrap gap-1.5">
              <span className="font-extrabold text-sm sm:text-base leading-tight tracking-wide text-white">
                PM SHRI KVS MANDLA
              </span>
              <span className="text-[10px] bg-yellow-400 text-blue-950 px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                PORTAL
              </span>
              {isDisconnected && (
                <button
                  onClick={retry}
                  title="Network disconnected. Tap to retry."
                  className="flex items-center gap-1 text-[10px] bg-rose-600 hover:bg-rose-500 text-white font-bold px-2 py-0.5 rounded-full border border-rose-400 animate-pulse transition-all cursor-pointer"
                >
                  <WifiOff className="w-3 h-3" />
                  <span>Oops! Offline</span>
                </button>
              )}
            </div>
            <p className="text-[11px] text-blue-200 truncate max-w-[220px] sm:max-w-none">
              PM SHRI Kendriya Vidyalaya Mandla • 2025–26
            </p>
          </div>
        </div>

        {/* User Profile / Status */}
        {session ? (
          <div className="flex items-center space-x-2">
            <button
              id="header-profile-btn"
              onClick={onOpenProfile}
              className="flex items-center space-x-2 bg-blue-800 hover:bg-blue-700 active:scale-95 transition-all text-white px-3 py-1.5 rounded-lg border border-blue-600 shadow-sm text-sm font-medium cursor-pointer"
            >
              <UserAvatar
                avatar={
                  session.avatar ||
                  (session.role === 'student'
                    ? session.student?.avatar
                    : session.teacher?.avatar)
                }
                role={session.role}
                defaultIcon={
                  session.role === 'teacher' && session.teacher?.subject
                    ? SUBJECTS_CONFIG[session.teacher.subject]?.flag
                    : undefined
                }
                size="sm"
                borderClass="border border-blue-400"
              />
              <div className="text-left hidden sm:block">
                <p className="text-xs font-semibold leading-tight truncate max-w-[120px]">
                  {session.role === 'student'
                    ? session.student?.name?.split(' ')[0]
                    : session.teacher?.name?.split(' ')[0]}
                </p>
                <p className="text-[10px] text-blue-200 uppercase font-bold">
                  {session.role === 'student' ? `Roll ${session.student?.rollNo}` : session.teacher?.subject}
                </p>
              </div>
              <User className="w-4 h-4 text-blue-300" />
            </button>

            <button
              id="header-quick-logout-btn"
              onClick={onLogout}
              title="Log Out"
              className="p-2 text-blue-200 hover:text-white hover:bg-blue-800 rounded-lg transition-colors active:scale-95"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center space-x-1.5 text-xs text-blue-200 bg-blue-950/60 px-2.5 py-1 rounded-full border border-blue-700/50">
            <span
              className={`w-2 h-2 rounded-full ${
                isDisconnected ? 'bg-rose-500 animate-ping' : 'bg-emerald-400 animate-pulse'
              }`}
            ></span>
            <span>{isDisconnected ? 'Offline Mode' : 'Live School Server'}</span>
          </div>
        )}
      </div>
    </header>
  );
};
