'use client';

import React from 'react';
import { PartyItem, Participant } from '@/types/party';
import { 
  Check, 
  CheckCircle2, 
  Circle, 
  User, 
  Trash2, 
  Edit3, 
  AlertCircle,
  Sparkles,
  ShoppingBag
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ItemCardProps {
  item: PartyItem;
  participants: Participant[];
  currentParticipant: Participant;
  onTogglePersonal: (itemId: string, participantId: string) => void;
  onClaimSharedSingle: (itemId: string, participantId: string, participantName: string) => void;
  onToggleSharedComplete: (itemId: string) => void;
  onOpenPledgeModal: (item: PartyItem) => void;
  onDeleteItem: (itemId: string) => void;
  onEditItem: (item: PartyItem) => void;
  onUpdateTargetQuantity?: (itemId: string, newTarget: number) => void;
}

export default function ItemCard({
  item,
  participants,
  currentParticipant,
  onTogglePersonal,
  onClaimSharedSingle,
  onToggleSharedComplete,
  onOpenPledgeModal,
  onDeleteItem,
  onEditItem,
  onUpdateTargetQuantity,
}: ItemCardProps) {
  const triggerCelebration = () => {
    try {
      confetti({
        particleCount: 35,
        spread: 60,
        origin: { y: 0.8 },
      });
    } catch {
      // safe fallback
    }
  };

  // ==========================================
  // 1. PERSONAL ITEM (개인 필수품)
  // ==========================================
  if (item.type === 'personal') {
    const completedBy = item.completedBy || [];
    const isPackedByMe = completedBy.includes(currentParticipant.id);
    const completedCount = completedBy.length;
    const totalParticipants = participants.length;
    const isAllPacked = totalParticipants > 0 && completedCount >= totalParticipants;

    return (
      <div className={`p-4 rounded-2xl border transition-all ${
        isPackedByMe
          ? 'bg-emerald-50/50 dark:bg-emerald-950/25 border-emerald-200 dark:border-emerald-800/60 shadow-xs'
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
      }`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] px-2 py-0.5 rounded-md font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
                개인 지참
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                {item.category}
              </span>
              {isAllPacked && (
                <span className="text-[11px] px-2 py-0.5 rounded-md font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> 전원 완료!
                </span>
              )}
            </div>

            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-1 break-words">
              {item.name}
            </h3>

            {item.notes && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                💡 {item.notes}
              </p>
            )}
          </div>

          {/* Quick Checklist Toggle */}
          <button
            onClick={() => {
              if (!isPackedByMe) triggerCelebration();
              onTogglePersonal(item.id, currentParticipant.id);
            }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all border min-h-[44px] active:scale-95 flex-shrink-0 ${
              isPackedByMe
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-600/30'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
            }`}
          >
            {isPackedByMe ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>챙김 완료!</span>
              </>
            ) : (
              <>
                <Circle className="w-4 h-4 text-slate-400" />
                <span>나 챙겼어요</span>
              </>
            )}
          </button>
        </div>

        {/* Participant packing list */}
        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-500 dark:text-slate-400">
            준비 완료 {completedCount} / {totalParticipants}명
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onEditItem(item)}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg"
              title="수정"
              aria-label="수정"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                if (confirm(`'${item.name}' 항목을 삭제하시겠습니까?`)) {
                  onDeleteItem(item.id);
                }
              }}
              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
              title="삭제"
              aria-label="삭제"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Participant Badges */}
        <div className="flex items-center gap-1 flex-wrap mt-1.5">
          {participants.map((p) => {
            const packed = completedBy.includes(p.id);
            return (
              <span
                key={p.id}
                className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[11px] font-medium border ${
                  packed
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                    : 'bg-slate-50 text-slate-400 border-slate-200 dark:bg-slate-800/40 dark:text-slate-500 dark:border-slate-800'
                }`}
              >
                <span>{p.avatar}</span>
                <span>{p.name}</span>
                {packed && <Check className="w-2.5 h-2.5 text-emerald-600" />}
              </span>
            );
          })}
        </div>
      </div>
    );
  }

  // ==========================================
  // 2. SHARED SINGLE ITEM (공용 단일 품목)
  // ==========================================
  if (item.type === 'shared_single') {
    const isAssigned = !!item.assigneeId;
    const isAssignedToMe = item.assigneeId === currentParticipant.id;
    const isDone = item.isCompleted;

    return (
      <div className={`p-4 rounded-2xl border transition-all ${
        isDone
          ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60 shadow-xs'
          : isAssignedToMe
          ? 'bg-indigo-50/40 dark:bg-indigo-950/30 border-indigo-300 dark:border-indigo-800 shadow-xs'
          : isAssigned
          ? 'bg-white dark:bg-slate-900 border-indigo-200 dark:border-indigo-900/60'
          : 'bg-white dark:bg-slate-900 border-amber-200/90 dark:border-amber-900/50 hover:border-amber-300'
      }`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] px-2 py-0.5 rounded-md font-bold bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60">
                공용 단일
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                {item.category}
              </span>
              {!isAssigned ? (
                <span className="text-[11px] px-2 py-0.5 rounded-md font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> 담당자 없음
                </span>
              ) : isDone ? (
                <span className="text-[11px] px-2 py-0.5 rounded-md font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 flex items-center gap-1">
                  <Check className="w-3 h-3" /> 준비 완료!
                </span>
              ) : (
                <span className="text-[11px] px-2 py-0.5 rounded-md font-semibold bg-blue-50 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                  찜 완료 (준비중)
                </span>
              )}
            </div>

            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-1 break-words">
              {item.name}
            </h3>

            {item.notes && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                💡 {item.notes}
              </p>
            )}
          </div>

          {/* Action Button: 찜하기 */}
          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
            {!isAssigned ? (
              <button
                onClick={() => {
                  triggerCelebration();
                  onClaimSharedSingle(item.id, currentParticipant.id, currentParticipant.name);
                }}
                className="px-3 py-2 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-sm active:scale-95 transition-all min-h-[44px] flex items-center gap-1"
              >
                <span>🙋</span>
                <span>내가 찜하기!</span>
              </button>
            ) : isAssignedToMe ? (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    if (!isDone) triggerCelebration();
                    onToggleSharedComplete(item.id);
                  }}
                  className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-bold border transition-all min-h-[44px] flex items-center gap-1.5 active:scale-95 ${
                    isDone
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white border-slate-300 dark:border-slate-600'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isDone ? '완료됨' : '완료 체크'}</span>
                </button>
                <button
                  onClick={() => onClaimSharedSingle(item.id, currentParticipant.id, currentParticipant.name)}
                  className="px-2 py-2 text-xs text-slate-400 hover:text-rose-500 min-h-[44px]"
                  title="찜 취소"
                >
                  취소
                </button>
              </div>
            ) : (
              <button
                onClick={() => onClaimSharedSingle(item.id, currentParticipant.id, currentParticipant.name)}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
              >
                내가 대신 찜
              </button>
            )}
          </div>
        </div>

        {/* Footer info & tools */}
        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">담당:</span>
            {isAssigned ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                <User className="w-3 h-3" />
                <span>{item.assigneeName}</span>
                {isAssignedToMe && <span className="text-[10px] bg-indigo-200 dark:bg-indigo-800 px-1 rounded">나</span>}
              </span>
            ) : (
              <span className="text-amber-600 dark:text-amber-400 font-semibold">
                아직 아무도 찜 안 했어요!
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onEditItem(item)}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg"
              title="수정"
              aria-label="수정"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                if (confirm(`'${item.name}' 항목을 삭제하시겠습니까?`)) {
                  onDeleteItem(item.id);
                }
              }}
              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
              title="삭제"
              aria-label="삭제"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // 3. SHARED QUANTITY ITEM (공용 수량 목표형)
  // ==========================================
  const target = item.targetQuantity || 1;
  const unit = item.unit || '개';
  const contributions = item.contributions || [];
  const currentTotal = contributions.reduce((acc, c) => acc + c.quantity, 0);
  const myContrib = contributions.find((c) => c.participantId === currentParticipant.id);
  const isFulfilled = currentTotal >= target;
  const percent = Math.min(Math.round((currentTotal / target) * 100), 100);

  return (
    <div className={`p-4 rounded-2xl border transition-all ${
      isFulfilled
        ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60 shadow-xs'
        : myContrib
        ? 'bg-indigo-50/30 dark:bg-indigo-950/20 border-indigo-200/80 dark:border-indigo-900/60 shadow-xs'
        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
    }`}>
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] px-2 py-0.5 rounded-md font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60">
              공용 수량
            </span>
            <span className="text-[11px] text-slate-400 font-medium">
              {item.category}
            </span>
            {isFulfilled ? (
              <span className="text-[11px] px-2 py-0.5 rounded-md font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 flex items-center gap-1">
                <Check className="w-3 h-3" /> 목표 수량 달성!
              </span>
            ) : (
              <span className="text-[11px] px-2 py-0.5 rounded-md font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300">
                {target - currentTotal}{unit} 더 필요
              </span>
            )}
          </div>

          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-1 break-words">
            {item.name}
          </h3>

          {item.notes && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              💡 {item.notes}
            </p>
          )}
        </div>

        {/* Target display with quick +/- buttons */}
        <div className="text-right flex-shrink-0">
          <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-baseline justify-end gap-1">
            <span className={isFulfilled ? 'text-emerald-600 dark:text-emerald-400' : 'text-indigo-600 dark:text-indigo-400'}>
              {currentTotal.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400 font-normal">
              / {target.toLocaleString()}{unit}
            </span>
          </div>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            ({percent}%)
          </span>

          {/* Target Quantity Quick Steppers */}
          {onUpdateTargetQuantity && (
            <div className="flex items-center justify-end gap-1 mt-1">
              <button
                onClick={() => onUpdateTargetQuantity(item.id, Math.max(1, target - (unit === 'g' ? 500 : 1)))}
                className="w-5 h-5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 text-xs font-bold flex items-center justify-center"
                title="목표 수량 감소"
              >
                -
              </button>
              <button
                onClick={() => onUpdateTargetQuantity(item.id, target + (unit === 'g' ? 500 : 1))}
                className="w-5 h-5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 text-xs font-bold flex items-center justify-center"
                title="목표 수량 증가"
              >
                +
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-2.5">
        <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isFulfilled
                ? 'bg-emerald-500'
                : currentTotal > 0
                ? 'bg-gradient-to-r from-amber-500 to-indigo-500'
                : 'bg-slate-200 dark:bg-slate-700'
            }`}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* Main 찜하기 Action Bar */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
        {/* Left: My 찜 Status */}
        <div className="flex-1 min-w-0">
          {myContrib ? (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200 border border-indigo-300 dark:border-indigo-700">
                📌 내 찜: {myContrib.quantity}{unit}
              </span>
              {myContrib.note && (
                <span className="text-[11px] text-slate-500 truncate max-w-[120px]">
                  ({myContrib.note})
                </span>
              )}
            </div>
          ) : (
            <span className="text-xs text-slate-400">
              아직 찜하지 않음
            </span>
          )}
        </div>

        {/* Right: Big 찜하기 Button */}
        <button
          onClick={() => onOpenPledgeModal(item)}
          className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 min-h-[44px] active:scale-95 transition-all shadow-sm ${
            myContrib
              ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
              : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-orange-500/20'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>{myContrib ? '찜 수량 수정' : '이거 찜하기!'}</span>
        </button>
      </div>

      {/* Contributors breakdown list */}
      <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1 flex-wrap flex-1 min-w-0">
          {contributions.length === 0 ? (
            <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
              아직 아무도 찜하지 않았어요!
            </span>
          ) : (
            contributions.map((c) => (
              <span
                key={c.participantId}
                className="inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-medium"
              >
                <span>👤 {c.participantName}:</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">{c.quantity}{unit}</span>
                {c.note && <span className="text-[10px] text-slate-400">({c.note})</span>}
              </span>
            ))
          )}
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => onEditItem(item)}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg"
            title="수정"
            aria-label="수정"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              if (confirm(`'${item.name}' 항목을 삭제하시겠습니까?`)) {
                onDeleteItem(item.id);
              }
            }}
            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
            title="삭제"
            aria-label="삭제"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
