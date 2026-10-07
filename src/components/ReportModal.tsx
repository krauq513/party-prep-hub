'use client';

import React, { useState } from 'react';
import { PartyItem, Participant } from '@/types/party';
import { X, Copy, Check, Share2 } from 'lucide-react';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  eventDate?: string;
  items: PartyItem[];
  participants: Participant[];
}

export default function ReportModal({
  isOpen,
  onClose,
  title,
  eventDate,
  items,
  participants,
}: ReportModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // 1. Missing / Incomplete Items
  const unassignedSingle = items.filter((i) => {
    if (i.type !== 'shared_single') return false;
    const assignees = i.assignees || (i.assigneeId ? [{ id: i.assigneeId, name: i.assigneeName || '' }] : []);
    return assignees.length === 0;
  });
  const unmetQuantity = items.filter((i) => {
    if (i.type !== 'shared_quantity') return false;
    const current = (i.contributions || []).reduce((acc, c) => acc + c.quantity, 0);
    return current < (i.targetQuantity || 1);
  });

  // 2. Contributions per participant
  const participantReports = participants.map((p) => {
    const singleAssigned = items
      .filter((i) => {
        if (i.type !== 'shared_single') return false;
        const assignees = i.assignees || (i.assigneeId ? [{ id: itemAssigneeId(i), name: i.assigneeName || '' }] : []);
        const hasAssignee = assignees.some((a) => a.id === p.id);
        const hasBoardGame = (i.boardGames || []).some((bg) => bg.participantId === p.id);
        const hasSubItem = (i.subItems || []).some((s) => s.participantId === p.id);
        return hasAssignee || hasBoardGame || hasSubItem;
      })
      .map((i) => {
        const myGames = (i.boardGames || []).filter((bg) => bg.participantId === p.id).map((bg) => bg.gameName);
        const mySubs = (i.subItems || []).filter((s) => s.participantId === p.id).map((s) => s.name);
        const combined = Array.from(new Set([...myGames, ...mySubs]));
        if (combined.length > 0) {
          return `${i.name} [${combined.join(', ')}]`;
        }
        return i.name;
      });

    const quantityContribs = items
      .filter((i) => i.type === 'shared_quantity')
      .map((i) => {
        const c = (i.contributions || []).find((contrib) => contrib.participantId === p.id);
        const mySubs = (i.subItems || []).filter((s) => s.participantId === p.id).map((s) => s.name);
        if (!c && mySubs.length === 0) return null;
        const qtyStr = c ? `${c.quantity}${i.unit}` : '';
        const subStr = mySubs.length > 0 ? ` [${mySubs.join(', ')}]` : '';
        return `${i.name} ${qtyStr}${subStr}`.trim();
      })
      .filter(Boolean) as string[];

    return {
      name: p.name,
      avatar: p.avatar,
      singleAssigned,
      quantityContribs,
    };
  });

  function itemAssigneeId(i: PartyItem) {
    return i.assigneeId || '';
  }

  // Calculate overall completion percent
  const personalItems = items.filter((i) => i.type === 'personal');
  const personalDoneSum = personalItems.reduce((acc, i) => acc + (i.completedBy?.length || 0), 0);
  const personalTotal = personalItems.length * (participants.length || 1);
  const personalRate = personalTotal > 0 ? (personalDoneSum / personalTotal) : 1;

  const sharedSingleItems = items.filter((i) => i.type === 'shared_single');
  const sharedSingleDone = sharedSingleItems.filter((i) => i.isCompleted || (i.boardGames && i.boardGames.length > 0)).length;
  const singleRate = sharedSingleItems.length > 0 ? (sharedSingleDone / sharedSingleItems.length) : 1;

  const sharedQuantityItems = items.filter((i) => i.type === 'shared_quantity');
  const quantityFulfilled = sharedQuantityItems.filter((i) => {
    const current = (i.contributions || []).reduce((acc, c) => acc + c.quantity, 0);
    return current >= (i.targetQuantity || 1);
  }).length;
  const quantityRate = sharedQuantityItems.length > 0 ? (quantityFulfilled / sharedQuantityItems.length) : 1;

  const overallPercent = Math.round(((personalRate + singleRate + quantityRate) / 3) * 100);

  // Generate plain text report
  const generateReportText = () => {
    let text = `🎉 [${title} 준비 현황 보고]\n`;
    if (eventDate) text += `📅 일시: ${eventDate}\n`;
    text += `📊 준비 완료율: ${overallPercent}%\n\n`;

    // Missing section
    if (unassignedSingle.length > 0 || unmetQuantity.length > 0) {
      text += `🚨 [아직 부족하거나 챙길 사람 필요한 물품]\n`;
      unassignedSingle.forEach((i) => {
        text += `• ${i.name} (담당자 미정!)\n`;
      });
      unmetQuantity.forEach((i) => {
        const current = (i.contributions || []).reduce((acc, c) => acc + c.quantity, 0);
        const needed = (i.targetQuantity || 1) - current;
        text += `• ${i.name}: ${needed}${i.unit} 부족 (현재 ${current}/${i.targetQuantity}${i.unit})\n`;
      });
      text += `\n`;
    } else {
      text += `✨ 공용 물품이 모두 준비되었습니다! 완벽해요!\n\n`;
    }

    // Participants contribution section
    text += `👥 [참가자별 준비/기여 현황]\n`;
    participantReports.forEach((pr) => {
      text += `${pr.avatar} ${pr.name}:\n`;
      const allContribs = [...pr.singleAssigned, ...pr.quantityContribs];
      if (allContribs.length > 0) {
        text += `  • ${allContribs.join(', ')}\n`;
      } else {
        text += `  • 아직 맡은 공용 물품 없음\n`;
      }
    });

    text += `\n💡 개인 지참 필수품(수건, 세면도구, 여벌옷 등)은 각자 사이트에서 체크해주세요!\n`;
    text += `🔗 실시간 웹사이트: https://party-prep-hub.vercel.app`;
    return text;
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generateReportText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      alert('클립보드 복사에 실패했습니다.');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: generateReportText(),
        });
      } catch {
        // user cancelled share
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-7 relative max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="닫기"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xl">
            📋
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              현황 보고서 (단톡방 공유용)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              카카오톡이나 단체 채팅방에 복사하여 붙여넣을 수 있는 보고서입니다.
            </p>
          </div>
        </div>

        {/* Preview Box */}
        <div className="bg-slate-50 dark:bg-slate-800/70 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 font-mono text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto select-all">
          {generateReportText()}
        </div>

        {/* Actions */}
        <div className="mt-5 flex items-center gap-2.5">
          <button
            onClick={handleCopy}
            className={`flex-1 py-3 rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 min-h-[48px] active:scale-98 ${
              copied
                ? 'bg-emerald-600 text-white shadow-emerald-600/20'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                <span>클립보드에 복사 완료!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>카톡 공유용 텍스트 복사</span>
              </>
            )}
          </button>

          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <button
              onClick={handleShare}
              className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors min-h-[48px] min-w-[48px] flex items-center justify-center"
              title="모바일 공유하기"
            >
              <Share2 className="w-4 h-4" />
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
