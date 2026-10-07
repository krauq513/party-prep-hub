'use client';

import React, { useState, useEffect } from 'react';
import { PartyItem, Participant } from '@/types/party';
import { getSubItemConfig } from '@/components/ItemCard';
import { X, Trash2 } from 'lucide-react';
import confetti from 'canvas-confetti';

interface PledgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: PartyItem | null;
  currentParticipant: Participant;
  onSavePledge: (itemId: string, quantity: number, note?: string) => void;
  onCancelPledge: (itemId: string) => void;
}

const NOTE_PRESETS = ['집에서 챙김', '마트에서 구매', '쿠팡 주문 완료', '냉장 보관 중'];

export default function PledgeModal({
  isOpen,
  onClose,
  item,
  currentParticipant,
  onSavePledge,
  onCancelPledge,
}: PledgeModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (item && isOpen) {
      const myContrib = (item.contributions || []).find(
        (c) => c.participantId === currentParticipant.id
      );
      if (myContrib) {
        setQuantity(myContrib.quantity);
        setNote(myContrib.note || '');
      } else {
        const currentSum = (item.contributions || []).reduce((acc, c) => acc + c.quantity, 0);
        const remaining = Math.max(1, (item.targetQuantity || 1) - currentSum);
        // Default to remaining or sensible step
        if (item.unit === 'g') {
          setQuantity(Math.min(remaining, 1000));
        } else {
          setQuantity(Math.min(remaining, 2));
        }
        setNote('');
      }
    }
  }, [item, currentParticipant, isOpen]);

  if (!isOpen || !item) return null;

  const target = item.targetQuantity || 1;
  const unit = item.unit || '개';
  const contributions = item.contributions || [];
  const currentTotal = contributions.reduce((acc, c) => acc + c.quantity, 0);
  const myContrib = contributions.find((c) => c.participantId === currentParticipant.id);
  const remaining = Math.max(0, target - (currentTotal - (myContrib?.quantity || 0)));
  const subConfig = getSubItemConfig(item);

  let currentNotePresets = NOTE_PRESETS;
  const itemName = (item.name || '').toLowerCase();
  if (itemName.includes('칵테일') || itemName.includes('양주') || itemName.includes('와인') || itemName.includes('위스키') || itemName.includes('하이볼')) {
    currentNotePresets = ['진토닉', '모히또', '하이볼', '깔루아', '위스키', ...NOTE_PRESETS];
  } else if (itemName.includes('고기') || itemName.includes('삼겹살') || itemName.includes('목살')) {
    currentNotePresets = ['삼겹살', '목살', '소고기', '항정살', ...NOTE_PRESETS];
  } else if (itemName.includes('맥주')) {
    currentNotePresets = ['카스', '테라', '켈리', '아사히', '칭따오', ...NOTE_PRESETS];
  } else if (itemName.includes('소주')) {
    currentNotePresets = ['참이슬', '처음처럼', '새로', '진로', ...NOTE_PRESETS];
  } else if (itemName.includes('음료')) {
    currentNotePresets = ['제로콜라', '사이다', '환타', '토닉워터', ...NOTE_PRESETS];
  } else if (itemName.includes('찌개') || itemName.includes('밀키트')) {
    currentNotePresets = ['부대찌개', '김치찌개', '된장찌개', '어묵탕', ...NOTE_PRESETS];
  } else if (itemName.includes('상비약')) {
    currentNotePresets = ['타이레놀', '소화제', '밴드', '소독약', ...NOTE_PRESETS];
  } else if (itemName.includes('소세지') || itemName.includes('소시지')) {
    currentNotePresets = ['그릴소세지', '킬바사', '프랑크', '비엔나', ...NOTE_PRESETS];
  } else if (itemName.includes('라면')) {
    currentNotePresets = ['신라면', '진라면', '너구리', '짜파게티', '불닭', ...NOTE_PRESETS];
  } else if (itemName.includes('과자')) {
    currentNotePresets = ['포카칩', '새우깡', '홈런볼', '프링글스', '먹태깡', ...NOTE_PRESETS];
  } else if (itemName.includes('마른안주') || itemName.includes('안주')) {
    currentNotePresets = ['먹태', '육포', '오징어', '쥐포', '견과류', ...NOTE_PRESETS];
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity <= 0) return;

    try {
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.7 },
      });
    } catch {
      // safe fallback
    }

    onSavePledge(item.id, quantity, note.trim() || undefined);
    onClose();
  };

  const handleCancel = () => {
    if (confirm(`'${item.name}' 찜하기를 취소하시겠습니까?`)) {
      onCancelPledge(item.id);
      onClose();
    }
  };

  const isGrams = unit === 'g';
  const presetAmounts = isGrams
    ? [500, 1000, 1500, remaining]
    : [1, 2, 3, 5, remaining].filter((v, idx, arr) => v > 0 && arr.indexOf(v) === idx);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 relative max-h-[92vh] overflow-y-auto">
        
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
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center font-bold text-2xl shadow-md shadow-orange-500/20">
            {subConfig.supported && subConfig.icon ? subConfig.icon : '🛒'}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs px-2 py-0.5 rounded-md font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60">
                가져갈게요 찜하기
              </span>
              <span className="text-xs text-slate-400">
                {currentParticipant.name}님
              </span>
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
              {item.name}
            </h2>
          </div>
        </div>

        {/* Current status info pill */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 mb-4">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500 dark:text-slate-400">전체 목표 수량</span>
            <span className="font-bold text-slate-900 dark:text-white">{target.toLocaleString()}{unit}</span>
          </div>
          <div className="flex justify-between items-center text-xs mt-1.5">
            <span className="text-slate-500 dark:text-slate-400">현재 다른 친구들이 찜한 수량</span>
            <span className="font-bold text-indigo-600 dark:text-indigo-400">
              {(currentTotal - (myContrib?.quantity || 0)).toLocaleString()}{unit}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs mt-1.5 pt-1.5 border-t border-slate-200/60 dark:border-slate-700/60">
            <span className="font-semibold text-amber-600 dark:text-amber-400">아직 필요한 수량</span>
            <span className="font-extrabold text-amber-600 dark:text-amber-400">{remaining.toLocaleString()}{unit}</span>
          </div>
        </div>

        {/* Sub-item preview if supported */}
        {subConfig.supported && (
          <div className="p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 mb-4 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-amber-900 dark:text-amber-200">
              <span className="flex items-center gap-1">
                <span>{subConfig.icon}</span>
                <span>등록된 {subConfig.title} ({(item.subItems || []).length}개)</span>
              </span>
            </div>
            {(item.subItems || []).length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {(item.subItems || []).map((s) => (
                  <span
                    key={s.id}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 font-medium text-amber-800 dark:text-amber-300 shadow-2xs"
                  >
                    <span>{subConfig.icon} {s.name}</span>
                    <span className="text-slate-400 text-[10px]">({s.participantName})</span>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80">
                아직 등록된 종류가 없습니다. 카드에서 세부 종류를 추가하거나 아래 메모에 적어주세요!
              </p>
            )}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSave} className="space-y-4">
          
          {/* Quantity Input & Stepper */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              내가 가져갈 수량 ({unit})
            </label>
            
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setQuantity((prev) => Math.max(1, prev - (isGrams ? 500 : 1)))}
                className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 text-xl font-bold flex items-center justify-center border border-slate-200 dark:border-slate-700 active:scale-95 transition-all"
              >
                -
              </button>

              <div className="relative flex-1">
                <input
                  type="number"
                  min="1"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full text-center py-2.5 px-3 rounded-2xl border-2 border-indigo-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-black text-xl min-h-[48px]"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                  {unit}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setQuantity((prev) => prev + (isGrams ? 500 : 1))}
                className="w-12 h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xl font-bold flex items-center justify-center active:scale-95 transition-all shadow-md shadow-indigo-600/20"
              >
                +
              </button>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 flex-wrap mt-2.5">
              <span className="text-[11px] text-slate-400">빠른 수량:</span>
              {presetAmounts.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setQuantity(amt)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-semibold border transition-all ${
                    quantity === amt
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                  }`}
                >
                  {amt === remaining && remaining > 0 ? `남은 ${amt}${unit} 전부 찜!` : `${amt.toLocaleString()}${unit}`}
                </button>
              ))}
            </div>
          </div>

          {/* Note Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              {subConfig.supported ? `${subConfig.title} / 메모 (선택)` : '준비 방법 / 메모 (선택)'}
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={subConfig.supported ? `예: ${subConfig.placeholder}` : "예: 집에서 가져옴, 마트 구매 예정, 쿠팡 주문 등"}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 min-h-[44px]"
            />

            {/* Quick Note Presets */}
            <div className="flex items-center gap-1.5 flex-wrap mt-2">
              {currentNotePresets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setNote(preset)}
                  className="px-2 py-0.5 rounded-lg text-[11px] font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60 transition-colors"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Submit & Cancel Buttons */}
          <div className="pt-3 space-y-2">
            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-base shadow-lg shadow-orange-500/25 active:scale-98 transition-all flex items-center justify-center gap-2 min-h-[48px]"
            >
              <span>🛒</span>
              <span>{quantity.toLocaleString()}{unit} 내가 찜하기!</span>
            </button>

            {myContrib && (
              <button
                type="button"
                onClick={handleCancel}
                className="w-full py-2.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors flex items-center justify-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>이 품목 찜하기 취소 (0개로 변경)</span>
              </button>
            )}
          </div>

        </form>
      </div>
    </div>
  );
}
