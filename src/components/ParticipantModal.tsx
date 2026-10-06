'use client';

import React, { useState } from 'react';
import { Participant, PartyItem } from '@/types/party';
import { X, UserPlus } from 'lucide-react';

interface ParticipantModalProps {
  isOpen: boolean;
  onClose: () => void;
  participants: Participant[];
  currentParticipant: Participant;
  items: PartyItem[];
  onSelectParticipant: (participant: Participant) => void;
  onAddParticipant: (name: string, avatar: string) => void;
}

const AVATAR_PRESETS = ['👑', '🦁', '🐼', '🦊', '🐶', '🐱', '🐻', '🐰', '🐯', '🐨', '🚀', '🍺', '✨', '🎸'];

export default function ParticipantModal({
  isOpen,
  onClose,
  participants,
  currentParticipant,
  items,
  onSelectParticipant,
  onAddParticipant,
}: ParticipantModalProps) {
  const [newName, setNewName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('🐼');
  const [isAdding, setIsAdding] = useState(false);

  if (!isOpen) return null;

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    onAddParticipant(newName.trim(), selectedAvatar);
    setNewName('');
    setIsAdding(false);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-7 relative max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="닫기"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xl">
            👥
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              참가자 관리 및 기여 현황
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              누가 어떤 준비물을 맡았는지 한눈에 보고 프로필을 전환할 수 있습니다.
            </p>
          </div>
        </div>

        {/* Participant List */}
        <div className="space-y-3 mb-6">
          {participants.map((p) => {
            const isCurrent = p.id === currentParticipant.id;
            
            // Calculate stats for this participant
            const personalPacked = items.filter(
              (i) => i.type === 'personal' && i.completedBy?.includes(p.id)
            );
            const totalPersonal = items.filter((i) => i.type === 'personal').length;
            
            const sharedAssigned = items.filter(
              (i) => i.type === 'shared_single' && i.assigneeId === p.id
            );
            
            const quantityContributions = items
              .filter((i) => i.type === 'shared_quantity')
              .map((i) => {
                const contrib = (i.contributions || []).find((c) => c.participantId === p.id);
                return contrib ? { name: i.name, quantity: contrib.quantity, unit: i.unit } : null;
              })
              .filter(Boolean) as { name: string; quantity: number; unit?: string }[];

            return (
              <div
                key={p.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isCurrent
                    ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl w-10 h-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center shadow-xs border border-slate-200/80 dark:border-slate-700">
                      {p.avatar}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          {p.name}
                        </span>
                        {isCurrent && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-300">
                            나 (접속 중)
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        개인 준비 {personalPacked.length}/{totalPersonal}개 완료
                      </div>
                    </div>
                  </div>

                  {!isCurrent && (
                    <button
                      onClick={() => onSelectParticipant(p)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-indigo-500 hover:text-indigo-600 transition-colors"
                    >
                      이 사용자로 전환
                    </button>
                  )}
                </div>

                {/* Contribution details */}
                <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-700/60 flex flex-wrap gap-1.5 text-xs">
                  {sharedAssigned.map((item) => (
                    <span
                      key={item.id}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-[11px] font-semibold"
                    >
                      👑 {item.name}
                    </span>
                  ))}
                  {quantityContributions.map((q, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-[11px] font-semibold"
                    >
                      📦 {q.name} +{q.quantity}{q.unit}
                    </span>
                  ))}
                  {sharedAssigned.length === 0 && quantityContributions.length === 0 && (
                    <span className="text-slate-400 dark:text-slate-500 text-[11px]">
                      아직 맡은 공용 물품이 없습니다.
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Add new participant toggle & form */}
        {!isAdding ? (
          <button
            onClick={() => setIsAdding(true)}
            className="w-full py-3 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 text-slate-600 dark:text-slate-300 hover:text-indigo-600 font-bold text-xs flex items-center justify-center gap-2 transition-colors min-h-[44px]"
          >
            <UserPlus className="w-4 h-4" />
            <span>새 참가자 추가하기</span>
          </button>
        ) : (
          <form onSubmit={handleAddSubmit} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3">
            <h3 className="font-bold text-xs text-slate-800 dark:text-slate-200">
              새 참가자 등록
            </h3>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                이름 또는 닉네임
              </label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="예: 철수, 지민, 성훈"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                대표 이모지
              </label>
              <div className="flex items-center gap-1.5 flex-wrap">
                {AVATAR_PRESETS.map((avatar) => (
                  <button
                    key={avatar}
                    type="button"
                    onClick={() => setSelectedAvatar(avatar)}
                    className={`w-8 h-8 rounded-lg text-base flex items-center justify-center border transition-all ${
                      selectedAvatar === avatar
                        ? 'border-indigo-600 bg-indigo-100 dark:bg-indigo-900/60 scale-110'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                    }`}
                  >
                    {avatar}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="submit"
                className="flex-1 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-500 transition-colors"
              >
                참가자 추가 완료
              </button>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                취소
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
