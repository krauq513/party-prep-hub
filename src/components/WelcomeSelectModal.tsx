'use client';

import React from 'react';
import { Participant } from '@/types/party';
import confetti from 'canvas-confetti';

interface WelcomeSelectModalProps {
  isOpen: boolean;
  participants: Participant[];
  onSelect: (participant: Participant) => void;
}

export default function WelcomeSelectModal({
  isOpen,
  participants,
  onSelect,
}: WelcomeSelectModalProps) {
  if (!isOpen) return null;

  const handlePick = (p: Participant) => {
    try {
      confetti({
        particleCount: 60,
        spread: 80,
        origin: { y: 0.6 },
      });
    } catch {
      // safe fallback
    }
    onSelect(p);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-7 relative max-h-[90vh] overflow-y-auto text-center">
        
        {/* Header */}
        <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 text-white flex items-center justify-center text-3xl shadow-lg shadow-purple-500/25 mb-4">
          🎉
        </div>

        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          반가워요! 당신은 누구인가요?
        </h2>

        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5 mb-6">
          본인의 이름을 선택해주세요.<br />
          다음 접속부터는 자동으로 기억됩니다!
        </p>

        {/* 13 Participants Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[55vh] overflow-y-auto p-1">
          {participants.map((p) => (
            <button
              key={p.id}
              onClick={() => handlePick(p)}
              className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:border-indigo-400 dark:hover:border-indigo-600 transition-all active:scale-95 flex flex-col items-center justify-center gap-1.5 min-h-[72px] group shadow-2xs"
            >
              <span className="text-2xl group-hover:scale-110 transition-transform">
                {p.avatar}
              </span>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                {p.name}
              </span>
            </button>
          ))}
        </div>

        <div className="mt-5 text-[11px] text-slate-400">
          * 나중에 언제든 상단에서 다른 사용자로 바꿀 수 있어요.
        </div>

      </div>
    </div>
  );
}
