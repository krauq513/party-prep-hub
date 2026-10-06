'use client';

import React from 'react';
import { Participant } from '@/types/party';
import { 
  Users, 
  Share2, 
  Plus, 
  RotateCw, 
  ExternalLink,
} from 'lucide-react';

interface HeaderProps {
  title: string;
  eventDate?: string;
  location?: string;
  naverMapUrl?: string;
  kakaoMapUrl?: string;
  participants: Participant[];
  currentParticipant: Participant;
  onSelectParticipant: (participant: Participant) => void;
  onOpenAddModal: () => void;
  onOpenReportModal: () => void;
  onOpenParticipantModal: () => void;
  onRefresh: () => void;
  isLoading: boolean;
}

export default function Header({
  title,
  eventDate,
  location,
  naverMapUrl,
  kakaoMapUrl,
  participants,
  currentParticipant,
  onSelectParticipant,
  onOpenAddModal,
  onOpenReportModal,
  onOpenParticipantModal,
  onRefresh,
  isLoading,
}: HeaderProps) {
  const nMapUrl = naverMapUrl || 'https://naver.me/xQe2uhho';
  const kMapUrl = kakaoMapUrl || 'https://kko.to/WSFJZnEqpn';

  return (
    <header className="sticky top-0 z-30 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors">
      <div className="max-w-6xl mx-auto px-4 py-3 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          
          {/* Title & Metadata */}
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-white shadow-md shadow-rose-500/20 text-xl font-bold flex-shrink-0 mt-0.5 sm:mt-0">
              🎉
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                  {title}
                </h1>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex-wrap">
                {eventDate && <span>📅 {eventDate}</span>}
                {location && <span>• 📍 {location}</span>}
                <span>• 👥 총 {participants.length}명</span>
              </div>
              
              {/* Map Quick Links */}
              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">📍 길찾기:</span>
                <a
                  href={nMapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-[#03C75A]/10 hover:bg-[#03C75A]/20 text-[#03C75A] border border-[#03C75A]/30 transition-colors active:scale-95 shadow-2xs"
                  title="네이버 지도로 열기"
                >
                  <span className="text-[10px]">🟢</span>
                  <span>네이버지도</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <a
                  href={kMapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-[#FEE500]/25 hover:bg-[#FEE500]/40 text-[#3C1E1E] dark:text-[#FEE500] border border-[#FEE500]/40 transition-colors active:scale-95 shadow-2xs"
                  title="카카오맵으로 열기"
                >
                  <span className="text-[10px]">🟡</span>
                  <span>카카오맵</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          {/* User selector & Actions */}
          <div className="flex items-center flex-wrap gap-2 justify-between sm:justify-end">
            
            {/* Current Participant Switcher */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-xs text-slate-500 dark:text-slate-400 px-2 font-medium hidden md:inline">
                접속자:
              </span>
              <div className="relative inline-block">
                <select
                  value={currentParticipant.id}
                  onChange={(e) => {
                    const found = participants.find((p) => p.id === e.target.value);
                    if (found) onSelectParticipant(found);
                  }}
                  aria-label="현재 참가자 선택"
                  className="appearance-none bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 font-semibold text-xs sm:text-sm pl-7 pr-7 py-1.5 rounded-lg border-0 shadow-sm focus:ring-2 focus:ring-indigo-500 cursor-pointer min-h-[36px]"
                >
                  {participants.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.avatar} {p.name}
                    </option>
                  ))}
                </select>
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm pointer-events-none">
                  {currentParticipant.avatar}
                </span>
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-xs">
                  ▼
                </span>
              </div>

              <button
                onClick={onOpenParticipantModal}
                className="p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors ml-1"
                title="참가자 추가 및 현황 보기"
                aria-label="참가자 목록 및 관리"
              >
                <Users className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Action Buttons */}
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 transition-all disabled:opacity-50 min-h-[40px] min-w-[40px] flex items-center justify-center"
              title="데이터 새로고침"
              aria-label="새로고침"
            >
              <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={onOpenReportModal}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700 min-h-[40px]"
            >
              <Share2 className="w-4 h-4 text-emerald-500" />
              <span className="hidden sm:inline">현황 보고</span>
              <span className="sm:hidden">보고</span>
            </button>

            <button
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-bold rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-md shadow-indigo-500/20 active:scale-95 transition-all min-h-[40px]"
            >
              <Plus className="w-4 h-4" />
              <span>준비물 추가</span>
            </button>

          </div>
        </div>
      </div>
    </header>
  );
}
