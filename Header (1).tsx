import React from 'react';
import { User, School, LogOut, WifiOff, RefreshCw, Bell, Calendar, BookOpen, History, Home } from 'lucide-react';
import { UserSession } from '../types';
import { SUBJECTS_CONFIG } from '../studentData';
import { UserAvatar } from './UserAvatar';
import { useNetworkStatus } from '../lib/networkStatus';

interface HeaderProps {
  session: UserSession | null;
  onOpenProfile: () => void;
  onLogout: () => void;
  onNavigateToHub?: () => void;
  onNavigateToHomework?: () => void;
  onNavigateToAnnouncements?: () => void;
  onNavigateToCalendar?: () => void;
  onNavigateToHistory?: () => void;
  unreadAnnouncementsCount?: number;
  currentView?: string;
}

export const Header: React.FC<HeaderProps> = ({
  session,
  onOpenProfile,
  onLogout,
  onNavigateToHub,
  onNavigateToHomework,
  onNavigateToAnnouncements,
  onNavigateToCalendar,
  onNavigateToHistory,
  unreadAnnouncementsCount = 0,
  currentView,
}) => {
  const { isDisconnected, isChecking, retry } = useNetworkStatus();

  return (
    <header className="w-full bg-blue-900 text-white shadow-md border-b-2 border-blue-950 sticky top-0 z-30 pt-[max(env(safe-area-inset-top,0px),10px)] pb-2.5 transition-all">
      <div className="max-w-4xl mx-auto px-4 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          {/* School / Class 5 Brand */}
          <div
            onClick={onNavigateToHub}
            className="flex items-center space-x-3 cursor-pointer group select-none"
            title="Go to School Portal Hub"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 bg-gradient-to-br from-yellow-400 to-amber-500 text-blue-950 rounded-xl flex items-center justify-center shadow-inner font-black text-xl border-2 border-yellow-300 shrink-0 group-hover:scale-105 transition-transform">
              🏫
            </div>
            <div>
              <div className="flex items-center flex-wrap gap-1.5">
                <span className="font-extrabold text-sm sm:text-base leading-tight tracking-wide text-white group-hover:text-yellow-300 transition-colors">
                  PM SHRI KV MANDLA
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
              <p className="text-[11px] text-blue-200 truncate max-w-[200px] sm:max-w-none">
                PM SHRI Kendriya Vidyalaya Mandla • Class 5
              </p>
            </div>
          </div>

          {/* User Profile / Status */}
          {session ? (
            <div className="flex items-center space-x-2">
              <button
                id="header-profile-btn"
                onClick={onOpenProfile}
                className="flex items-center space-x-2 bg-blue-800 hover:bg-blue-700 active:scale-95 transition-all text-white px-2.5 sm:px-3 py-1.5 rounded-xl border border-blue-600 shadow-sm text-sm font-medium cursor-pointer"
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
                <User className="w-3.5 h-3.5 text-blue-300" />
              </button>

              <button
                id="header-quick-logout-btn"
                onClick={onLogout}
                title="Log Out"
                className="p-2 text-blue-200 hover:text-white hover:bg-blue-800 rounded-xl transition-colors active:scale-95 cursor-pointer"
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
              <span>{isDisconnected ? 'Offline Mode' : 'Live Server'}</span>
            </div>
          )}
        </div>

        {/* Global Quick Navigation Bar */}
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-0.5 text-xs pt-0.5 border-t border-blue-800/60">
          {onNavigateToHub && (
            <button
              onClick={onNavigateToHub}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                currentView === 'first-page'
                  ? 'bg-yellow-400 text-blue-950 shadow-xs'
                  : 'text-blue-200 hover:bg-blue-800 hover:text-white'
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              <span>Hub</span>
            </button>
          )}

          {onNavigateToHomework && (
            <button
              onClick={onNavigateToHomework}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                currentView === 'dashboard'
                  ? 'bg-yellow-400 text-blue-950 shadow-xs'
                  : 'text-blue-200 hover:bg-blue-800 hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Homework</span>
            </button>
          )}

          {onNavigateToAnnouncements && (
            <button
              onClick={onNavigateToAnnouncements}
              className={`relative flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                currentView === 'announcements'
                  ? 'bg-yellow-400 text-blue-950 shadow-xs'
                  : 'text-blue-200 hover:bg-blue-800 hover:text-white'
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Notices</span>
              {unreadAnnouncementsCount > 0 && (
                <span className="bg-red-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-white animate-bounce">
                  {unreadAnnouncementsCount}
                </span>
              )}
            </button>
          )}

          {onNavigateToCalendar && (
            <button
              onClick={onNavigateToCalendar}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                currentView === 'calendar'
                  ? 'bg-yellow-400 text-blue-950 shadow-xs'
                  : 'text-blue-200 hover:bg-blue-800 hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Calendar</span>
            </button>
          )}

          {onNavigateToHistory && (
            <button
              onClick={onNavigateToHistory}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                currentView === 'history'
                  ? 'bg-yellow-400 text-blue-950 shadow-xs'
                  : 'text-blue-200 hover:bg-blue-800 hover:text-white'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>History</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
