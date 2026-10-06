'use client';

import React, { useState, useEffect } from 'react';
import { PartyItem, ItemType } from '@/types/party';
import { X, Save } from 'lucide-react';

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Partial<PartyItem>) => void;
  editItem?: PartyItem | null;
}

const CATEGORY_OPTIONS = [
  '개인필수',
  '식기',
  '고기/메인',
  '채소/곁들임',
  '양념/소스',
  '주류/음료',
  '식사/안주',
  '오락/비상용품',
  '기타',
];

const UNIT_PRESETS = ['개', '병', '캔', '봉', '팩', 'g', 'kg', '롤', '벌', '통', '세트'];

export default function AddItemModal({
  isOpen,
  onClose,
  onSave,
  editItem,
}: AddItemModalProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('고기/메인');
  const [type, setType] = useState<ItemType>('shared_quantity');
  const [targetQuantity, setTargetQuantity] = useState(2);
  const [unit, setUnit] = useState('개');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (editItem) {
      setName(editItem.name);
      setCategory(editItem.category);
      setType(editItem.type);
      setTargetQuantity(editItem.targetQuantity || 2);
      setUnit(editItem.unit || '개');
      setNotes(editItem.notes || '');
    } else {
      setName('');
      setCategory('고기/메인');
      setType('shared_quantity');
      setTargetQuantity(2);
      setUnit('개');
      setNotes('');
    }
  }, [editItem, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      ...(editItem ? { id: editItem.id } : {}),
      name: name.trim(),
      category,
      type,
      ...(type === 'shared_quantity' ? { targetQuantity: Number(targetQuantity) || 1, unit } : {}),
      notes: notes.trim() || undefined,
    });
    onClose();
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
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-lg">
            {editItem ? '✏️' : '➕'}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {editItem ? '준비물 항목 수정' : '새 준비물 항목 추가'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              특성에 맞게 개인용, 공용 단일, 수량형을 선택해주세요.
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Item Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              준비물 이름 <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 삼겹살, 소주, 돗자리, 루미큐브"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 min-h-[44px]"
            />
          </div>

          {/* Type Selector (3 options) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              준비물 특성/유형 <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              
              <button
                type="button"
                onClick={() => setType('personal')}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  type === 'personal'
                    ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-200 shadow-sm'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                <div className="text-base mb-1">🎒</div>
                <div className="font-bold text-xs">개인 필수</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                  각자 1개씩 챙기기
                </div>
              </button>

              <button
                type="button"
                onClick={() => setType('shared_single')}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  type === 'shared_single'
                    ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-200 shadow-sm'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                <div className="text-base mb-1">👑</div>
                <div className="font-bold text-xs">공용 단일</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                  1명이 맡아서 준비
                </div>
              </button>

              <button
                type="button"
                onClick={() => setType('shared_quantity')}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  type === 'shared_quantity'
                    ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-200 shadow-sm'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                <div className="text-base mb-1">📦</div>
                <div className="font-bold text-xs">공용 수량</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                  목표 수량 나눠 챙김
                </div>
              </button>

            </div>
          </div>

          {/* Quantity & Unit (Visible only if type === 'shared_quantity') */}
          {type === 'shared_quantity' && (
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    목표 수량
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={targetQuantity}
                    onChange={(e) => setTargetQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    단위
                  </label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="개, 병, 캔, g 등"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                  />
                </div>
              </div>

              {/* Quick unit presets */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-[11px] text-slate-400 font-medium">단위 빠른 선택:</span>
                {UNIT_PRESETS.map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setUnit(u)}
                    className={`px-2 py-0.5 text-xs rounded-md border ${
                      unit === u
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Category */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              카테고리 분류
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 min-h-[44px]"
            >
              {CATEGORY_OPTIONS.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Notes / Remarks */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              메모 / 안내사항 (선택)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="예: 삼겹살과 목살 반반, 에어컨 추위 대비, 찬스 협찬 등"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 min-h-[44px]"
            />
          </div>

          {/* Submit button */}
          <div className="pt-3">
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-sm shadow-md shadow-indigo-600/20 active:scale-98 transition-all flex items-center justify-center gap-2 min-h-[48px]"
            >
              <Save className="w-4 h-4" />
              <span>{editItem ? '변경사항 저장하기' : '준비물 추가하기'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
