'use client';

import React, { useState } from 'react';
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
  participants?: Participant[];
  currentParticipant: Participant;
  onTogglePersonal: (itemId: string, participantId: string) => void;
  onClaimSharedSingle: (itemId: string, participantId: string, participantName: string) => void;
  onToggleSharedComplete: (itemId: string) => void;
  onOpenPledgeModal: (item: PartyItem) => void;
  onDeleteItem: (itemId: string) => void;
  onEditItem: (item: PartyItem) => void;
  onUpdateTargetQuantity?: (itemId: string, newTarget: number) => void;
  onAddBoardGame?: (itemId: string, gameName: string, participantId: string, participantName: string) => void;
  onRemoveBoardGame?: (itemId: string, gameId: string) => void;
}

export default function ItemCard({
  item,
  currentParticipant,
  onTogglePersonal,
  onClaimSharedSingle,
  onToggleSharedComplete,
  onOpenPledgeModal,
  onDeleteItem,
  onEditItem,
  onUpdateTargetQuantity,
  onAddBoardGame,
  onRemoveBoardGame,
}: ItemCardProps) {
  const [inputGameName, setInputGameName] = useState('');

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
  // 1. PERSONAL ITEM (개인 필수품 - 각 개인이 자기 것만 확인)
  // ==========================================
  if (item.type === 'personal') {
    const completedBy = item.completedBy || [];
    const isPackedByMe = completedBy.includes(currentParticipant.id);

    return (
      <div className={`p-3 sm:p-4 rounded-2xl border transition-all flex flex-col justify-between h-full ${
        isPackedByMe
          ? 'bg-emerald-50/50 dark:bg-emerald-950/25 border-emerald-200 dark:border-emerald-800/60 shadow-xs'
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
      }`}>
        <div>
          {/* Top Row: Category Badge + Edit/Delete */}
          <div className="flex items-center justify-between gap-1 mb-1">
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-[10px] sm:text-[11px] px-1.5 sm:px-2 py-0.5 rounded-md font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
                개인 지참
              </span>
              {isPackedByMe && (
                <span className="text-[10px] sm:text-[11px] px-1.5 py-0.5 rounded-md font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 flex items-center gap-0.5">
                  <Sparkles className="w-2.5 h-2.5" /> 완료!
                </span>
              )}
            </div>

            <div className="flex items-center gap-0.5">
              <button
                onClick={() => onEditItem(item)}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg"
                title="수정"
                aria-label="수정"
              >
                <Edit3 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </button>
              <button
                onClick={() => {
                  if (confirm(`'${item.name}' 항목을 삭제하시겠습니까?`)) {
                    onDeleteItem(item.id);
                  }
                }}
                className="p-1 text-slate-400 hover:text-rose-600 rounded-lg"
                title="삭제"
                aria-label="삭제"
              >
                <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </button>
            </div>
          </div>

          {/* Item Name */}
          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-snug break-words">
            {item.name}
          </h3>

          {/* Notes */}
          {item.notes && (
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
              💡 {item.notes}
            </p>
          )}
        </div>

        {/* Bottom Area */}
        <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/70 space-y-1.5">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              🔒 개인 체크
            </span>
            <span className={isPackedByMe ? "font-bold text-emerald-600 dark:text-emerald-400 text-xs" : "text-slate-400 text-xs"}>
              {isPackedByMe ? "챙김 완료 ✅" : "미완료"}
            </span>
          </div>

          <button
            onClick={() => {
              if (!isPackedByMe) triggerCelebration();
              onTogglePersonal(item.id, currentParticipant.id);
            }}
            className={`w-full flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all border min-h-[40px] active:scale-95 ${
              isPackedByMe
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs shadow-emerald-600/30'
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
      </div>
    );
  }

  // ==========================================
  // 2. SHARED SINGLE ITEM (공용 단일 품목 - 여러 명 찜 가능 & 보드게임 이름 등록)
  // ==========================================
  if (item.type === 'shared_single') {
    const isBoardGame = item.name.includes('보드게임') || (item.boardGames && item.boardGames.length > 0);
    const assignees = item.assignees || (item.assigneeId ? [{ id: item.assigneeId, name: item.assigneeName || '' }] : []);
    const isPledgedByMe = assignees.some((a) => a.id === currentParticipant.id);
    const boardGamesList = item.boardGames || [];
    const hasAnyPledge = assignees.length > 0 || boardGamesList.length > 0;
    const isDone = item.isCompleted || boardGamesList.length > 0;

    const handleClaimClick = () => {
      if (isBoardGame) {
        const game = window.prompt('가져오실 보드게임 이름을 적어주세요! (예: 스플렌더, 루미큐브, 할리갈리)');
        if (game && game.trim()) {
          triggerCelebration();
          onAddBoardGame?.(item.id, game.trim(), currentParticipant.id, currentParticipant.name);
          return;
        }
      }
      triggerCelebration();
      onClaimSharedSingle(item.id, currentParticipant.id, currentParticipant.name);
    };

    return (
      <div className={`p-3 sm:p-4 rounded-2xl border transition-all flex flex-col justify-between h-full ${
        isDone
          ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60 shadow-xs'
          : isPledgedByMe
          ? 'bg-indigo-50/40 dark:bg-indigo-950/30 border-indigo-300 dark:border-indigo-800 shadow-xs'
          : hasAnyPledge
          ? 'bg-white dark:bg-slate-900 border-indigo-200 dark:border-indigo-900/60'
          : 'bg-white dark:bg-slate-900 border-amber-200/90 dark:border-amber-900/50 hover:border-amber-300'
      }`}>
        <div>
          {/* Top Row: Category Badge + Status Badge + Edit/Delete */}
          <div className="flex items-center justify-between gap-1 mb-1">
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-[10px] sm:text-[11px] px-1.5 sm:px-2 py-0.5 rounded-md font-bold bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60">
                공용
              </span>
              {isBoardGame && boardGamesList.length > 0 ? (
                <span className="text-[10px] sm:text-[11px] px-1.5 py-0.5 rounded-md font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 flex items-center gap-0.5">
                  🎲 {boardGamesList.length}개
                </span>
              ) : !hasAnyPledge ? (
                <span className="text-[10px] sm:text-[11px] px-1.5 py-0.5 rounded-md font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 flex items-center gap-0.5">
                  <AlertCircle className="w-2.5 h-2.5" /> 미찜
                </span>
              ) : isDone ? (
                <span className="text-[10px] sm:text-[11px] px-1.5 py-0.5 rounded-md font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 flex items-center gap-0.5">
                  <Check className="w-2.5 h-2.5" /> 완료!
                </span>
              ) : (
                <span className="text-[10px] sm:text-[11px] px-1.5 py-0.5 rounded-md font-semibold bg-blue-50 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                  {assignees.length}명 찜
                </span>
              )}
            </div>

            <div className="flex items-center gap-0.5">
              <button
                onClick={() => onEditItem(item)}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg"
                title="수정"
                aria-label="수정"
              >
                <Edit3 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </button>
              <button
                onClick={() => {
                  if (confirm(`'${item.name}' 항목을 삭제하시겠습니까?`)) {
                    onDeleteItem(item.id);
                  }
                }}
                className="p-1 text-slate-400 hover:text-rose-600 rounded-lg"
                title="삭제"
                aria-label="삭제"
              >
                <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </button>
            </div>
          </div>

          {/* Item Name */}
          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-snug break-words">
            {item.name}
          </h3>

          {/* Notes */}
          {item.notes && (
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
              💡 {item.notes}
            </p>
          )}

          {/* Assignees chips */}
          <div className="mt-2 flex items-center gap-1 flex-wrap text-[11px]">
            <span className="text-slate-400 text-[10px]">찜:</span>
            {assignees.length > 0 ? (
              assignees.map((a) => (
                <span
                  key={a.id}
                  className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-[10px]"
                >
                  <User className="w-2.5 h-2.5" />
                  <span className="truncate max-w-[50px]">{a.name}</span>
                  {a.id === currentParticipant.id && <span className="text-[8px] bg-indigo-200 dark:bg-indigo-800 px-0.5 rounded">나</span>}
                </span>
              ))
            ) : (
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                아직 아무도 찜 안 함
              </span>
            )}
          </div>

          {/* Board game specific registration box */}
          {isBoardGame && (
            <div className="mt-2 p-2 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-amber-900 dark:text-amber-200">
                <span className="flex items-center gap-1">
                  <span>🎲</span>
                  <span>보드게임 ({boardGamesList.length})</span>
                </span>
              </div>

              {boardGamesList.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {boardGamesList.map((bg) => {
                    const isMine = bg.participantId === currentParticipant.id;
                    return (
                      <span
                        key={bg.id}
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg text-[10px] bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 shadow-2xs"
                      >
                        <span className="font-bold text-amber-800 dark:text-amber-300 truncate max-w-[70px]">🎲 {bg.gameName}</span>
                        <span className="text-slate-400">({bg.participantName})</span>
                        {isMine && (
                          <button
                            type="button"
                            onClick={() => onRemoveBoardGame?.(item.id, bg.id)}
                            className="text-slate-400 hover:text-rose-600 font-bold ml-0.5 text-[10px]"
                            title="게임 취소"
                          >
                            ✕
                          </button>
                        )}
                      </span>
                    );
                  })}
                </div>
              ) : (
                <p className="text-[10px] text-amber-700/80 dark:text-amber-400/80">
                  가져올 보드게임을 등록해주세요!
                </p>
              )}

              {/* Quick Inline Board Game Addition */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!inputGameName.trim()) return;
                  triggerCelebration();
                  onAddBoardGame?.(item.id, inputGameName.trim(), currentParticipant.id, currentParticipant.name);
                  setInputGameName('');
                }}
                className="flex items-center gap-1 pt-0.5"
              >
                <input
                  type="text"
                  value={inputGameName}
                  onChange={(e) => setInputGameName(e.target.value)}
                  placeholder="게임명 (예: 루미큐브)"
                  className="min-w-0 flex-1 px-2 py-1 text-[11px] rounded-lg border border-amber-300 dark:border-amber-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden"
                />
                <button
                  type="submit"
                  disabled={!inputGameName.trim()}
                  className="px-2 py-1 text-[11px] font-bold rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white shadow-xs transition-all active:scale-95 flex-shrink-0"
                >
                  + 등록
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Bottom Area: Action Buttons */}
        <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/70 space-y-1.5">
          {isPledgedByMe ? (
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  if (!isDone) triggerCelebration();
                  onToggleSharedComplete(item.id);
                }}
                className={`flex-1 flex items-center justify-center gap-1 py-2 px-2 rounded-xl text-xs sm:text-sm font-bold border transition-all min-h-[40px] active:scale-95 ${
                  isDone
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white border-slate-300 dark:border-slate-600'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isDone ? '완료됨' : '완료 체크'}</span>
              </button>
              <button
                onClick={() => onClaimSharedSingle(item.id, currentParticipant.id, currentParticipant.name)}
                className="px-2 py-2 text-[11px] text-slate-400 hover:text-rose-500 min-h-[40px] flex-shrink-0"
                title="내 찜 취소"
              >
                취소
              </button>
            </div>
          ) : (
            <button
              onClick={handleClaimClick}
              className="w-full flex items-center justify-center gap-1 py-2 px-2.5 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-xs active:scale-95 transition-all min-h-[40px]"
            >
              <span>🙋</span>
              <span>내가 찜하기!</span>
            </button>
          )}
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
    <div className={`p-3 sm:p-4 rounded-2xl border transition-all flex flex-col justify-between h-full ${
      isFulfilled
        ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60 shadow-xs'
        : myContrib
        ? 'bg-indigo-50/30 dark:bg-indigo-950/20 border-indigo-200/80 dark:border-indigo-900/60 shadow-xs'
        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
    }`}>
      <div>
        {/* Top row: Badges + Edit/Delete */}
        <div className="flex items-center justify-between gap-1 mb-1">
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-[10px] sm:text-[11px] px-1.5 sm:px-2 py-0.5 rounded-md font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60">
              수량
            </span>
            {isFulfilled ? (
              <span className="text-[10px] sm:text-[11px] px-1.5 py-0.5 rounded-md font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 flex items-center gap-0.5">
                <Check className="w-2.5 h-2.5" /> 달성!
              </span>
            ) : (
              <span className="text-[10px] sm:text-[11px] px-1.5 py-0.5 rounded-md font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300">
                {target - currentTotal}{unit} 부족
              </span>
            )}
          </div>

          <div className="flex items-center gap-0.5">
            <button
              onClick={() => onEditItem(item)}
              className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg"
              title="수정"
              aria-label="수정"
            >
              <Edit3 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </button>
            <button
              onClick={() => {
                if (confirm(`'${item.name}' 항목을 삭제하시겠습니까?`)) {
                  onDeleteItem(item.id);
                }
              }}
              className="p-1 text-slate-400 hover:text-rose-600 rounded-lg"
              title="삭제"
              aria-label="삭제"
            >
              <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </button>
          </div>
        </div>

        {/* Item Name */}
        <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-snug break-words">
          {item.name}
        </h3>

        {/* Notes */}
        {item.notes && (
          <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
            💡 {item.notes}
          </p>
        )}

        {/* Target display with quick +/- buttons */}
        <div className="flex items-center justify-between gap-1 mt-2">
          <div className="flex items-baseline gap-1">
            <span className={`text-sm sm:text-base font-black ${isFulfilled ? 'text-emerald-600 dark:text-emerald-400' : 'text-indigo-600 dark:text-indigo-400'}`}>
              {currentTotal.toLocaleString()}
            </span>
            <span className="text-[11px] sm:text-xs text-slate-400 font-normal">
              / {target.toLocaleString()}{unit}
            </span>
            <span className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400">
              ({percent}%)
            </span>
          </div>

          {onUpdateTargetQuantity && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => onUpdateTargetQuantity(item.id, Math.max(1, target - (unit === 'g' ? 500 : 1)))}
                className="w-5 h-5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 text-xs font-bold flex items-center justify-center active:scale-95"
                title="목표 수량 감소"
              >
                -
              </button>
              <button
                onClick={() => onUpdateTargetQuantity(item.id, target + (unit === 'g' ? 500 : 1))}
                className="w-5 h-5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 text-xs font-bold flex items-center justify-center active:scale-95"
                title="목표 수량 증가"
              >
                +
              </button>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mt-1.5">
          <div className="w-full h-1.5 sm:h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
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

        {/* Contributors breakdown list */}
        <div className="mt-2 flex flex-wrap gap-1 text-[10px]">
          {contributions.length === 0 ? (
            <span className="text-amber-600 dark:text-amber-400 font-medium">
              아직 찜 없음
            </span>
          ) : (
            contributions.map((c) => (
              <span
                key={c.participantId}
                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-medium"
              >
                <span className="truncate max-w-[45px]">👤 {c.participantName}:</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">{c.quantity}{unit}</span>
              </span>
            ))
          )}
        </div>
      </div>

      {/* Main 찜하기 Action Bar */}
      <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/70 space-y-1.5">
        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
          <span className="text-[10px] text-slate-400 font-medium truncate max-w-[110px]">
            {myContrib ? `📌 내 찜: ${myContrib.quantity}${unit}` : '아직 찜하지 않음'}
          </span>
          {isFulfilled && (
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex-shrink-0">
              달성 ✨
            </span>
          )}
        </div>

        <button
          onClick={() => onOpenPledgeModal(item)}
          className={`w-full flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs sm:text-sm font-bold min-h-[40px] active:scale-95 transition-all shadow-xs ${
            myContrib
              ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
              : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-orange-500/20'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>{myContrib ? '찜 수량 수정' : '내가 찜하기!'}</span>
        </button>
      </div>
    </div>
  );
}
