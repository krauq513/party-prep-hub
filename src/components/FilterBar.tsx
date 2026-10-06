'use client';

import React from 'react';
import { FilterCategory, FilterType, FilterStatus } from '@/types/party';
import { Search, X } from 'lucide-react';

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: FilterCategory;
  onSelectCategory: (category: FilterCategory) => void;
  selectedType: FilterType;
  onSelectType: (type: FilterType) => void;
  selectedStatus: FilterStatus;
  onSelectStatus: (status: FilterStatus) => void;
  filteredCount: number;
  totalCount: number;
}

const CATEGORIES: { label: FilterCategory; emoji: string }[] = [
  { label: '전체', emoji: '🌟' },
  { label: '개인필수', emoji: '🎒' },
  { label: '식기', emoji: '🍽️' },
  { label: '고기/메인', emoji: '🥩' },
  { label: '채소/곁들임', emoji: '🥬' },
  { label: '양념/소스', emoji: '🧂' },
  { label: '주류/음료', emoji: '🍺' },
  { label: '식사/안주', emoji: '🍜' },
  { label: '오락/비상용품', emoji: '🎲' },
];

export default function FilterBar({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onSelectCategory,
  selectedType,
  onSelectType,
  selectedStatus,
  onSelectStatus,
  filteredCount,
  totalCount,
}: FilterBarProps) {
  return (
    <div className="space-y-3 mb-6">
      
      {/* Search & Status Tabs */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="준비물 검색 (예: 삼겹살, 소주, 젓가락, 보드게임)..."
            aria-label="준비물 검색"
            className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 shadow-sm transition-all min-h-[44px]"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full"
              aria-label="검색어 지우기"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status view tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 self-start md:self-auto overflow-x-auto max-w-full">
          <button
            onClick={() => onSelectStatus('all')}
            className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap min-h-[36px] ${
              selectedStatus === 'all'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            전체 보기
          </button>
          
          <button
            onClick={() => onSelectStatus('my_items')}
            className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap flex items-center gap-1 min-h-[36px] ${
              selectedStatus === 'my_items'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>🙋‍♂️</span>
            <span>내 챙길 목록</span>
          </button>

          <button
            onClick={() => onSelectStatus('incomplete')}
            className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap flex items-center gap-1 min-h-[36px] ${
              selectedStatus === 'incomplete'
                ? 'bg-amber-600 text-white shadow-sm shadow-amber-600/30'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>⚠️</span>
            <span>부족/미정만</span>
          </button>
        </div>

      </div>

      {/* Category Pills & Type Filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 pt-1">
        
        {/* Category Pills (horizontal scrollable on mobile) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full no-scrollbar">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.label;
            return (
              <button
                key={cat.label}
                onClick={() => onSelectCategory(cat.label)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border min-h-[36px] flex items-center gap-1 ${
                  isSelected
                    ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-sm'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <span>{cat.emoji}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Type select & Count */}
        <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
          <select
            value={selectedType}
            onChange={(e) => onSelectType(e.target.value as FilterType)}
            aria-label="유형 필터"
            className="text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 rounded-xl px-2.5 py-1.5 focus:ring-2 focus:ring-indigo-500 min-h-[36px]"
          >
            <option value="all">모든 유형</option>
            <option value="personal">🎒 개인 필수만</option>
            <option value="shared_single">👑 공용 단일만</option>
            <option value="shared_quantity">📦 공용 수량형만</option>
          </select>
          
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {filteredCount} / {totalCount}개
          </span>
        </div>

      </div>

    </div>
  );
}
