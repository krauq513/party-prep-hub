'use client';

import React from 'react';
import { PartyItem } from '@/types/party';
import { X, RotateCcw, Trash2 } from 'lucide-react';
import confetti from 'canvas-confetti';

interface TrashModalProps {
  isOpen: boolean;
  onClose: () => void;
  deletedItems: PartyItem[];
  onRestoreItem: (itemId: string) => void;
  onClearTrash: () => void;
}

export default function TrashModal({
  isOpen,
  onClose,
  deletedItems,
  onRestoreItem,
  onClearTrash,
}: TrashModalProps) {
  if (!isOpen) return null;

  const handleRestore = (itemId: string) => {
    try {
      confetti({
        particleCount: 35,
        spread: 60,
        origin: { y: 0.7 },
      });
    } catch {
      // safe fallback
    }
    onRestoreItem(itemId);
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
          <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold text-xl">
            🗑️
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              삭제된 준비물 휴지통 ({deletedItems.length}개)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              실수로 잘못 삭제한 준비물을 [복구하기] 버튼으로 즉시 되살릴 수 있습니다.
            </p>
          </div>
        </div>

        {/* Empty State */}
        {deletedItems.length === 0 ? (
          <div className="py-12 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-800">
            <span className="text-4xl block mb-2">✨</span>
            <p className="font-bold text-sm text-slate-700 dark:text-slate-300">
              휴지통이 비어 있습니다
            </p>
            <p className="text-xs text-slate-400 mt-1">
              삭제된 준비물이 생기면 이곳에 임시 보관됩니다.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[50vh] overflow-y-auto p-1">
            {deletedItems.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between gap-3 transition-all"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                      {item.category}
                    </span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                      {item.name}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {item.type === 'shared_quantity' ? `목표 ${item.targetQuantity}${item.unit}` : item.type === 'personal' ? '개인 지참' : '공용 단일'}
                    {item.notes ? ` • ${item.notes}` : ''}
                  </div>
                </div>

                <button
                  onClick={() => handleRestore(item.id)}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm flex items-center gap-1 active:scale-95 transition-all flex-shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>복구하기</span>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Footer Actions */}
        {deletedItems.length > 0 && (
          <div className="mt-5 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <button
              onClick={() => {
                if (confirm('휴지통을 완전히 비우시겠습니까? 영구 삭제됩니다.')) {
                  onClearTrash();
                }
              }}
              className="text-xs text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 font-semibold flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>휴지통 비우기</span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
            >
              닫기
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
