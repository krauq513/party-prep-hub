'use client';

import React from 'react';
import { FilterStatus } from '@/types/party';
import { Home, Bookmark, AlertTriangle, Plus, FileText } from 'lucide-react';

interface MobileBottomNavProps {
  selectedStatus: FilterStatus;
  onSelectStatus: (status: FilterStatus) => void;
  onOpenAddModal: () => void;
  onOpenReportModal: () => void;
  myPledgedCount: number;
  incompleteCount: number;
}

export default function MobileBottomNav({
  selectedStatus,
  onSelectStatus,
  onOpenAddModal,
  onOpenReportModal,
  myPledgedCount,
  incompleteCount,
}: MobileBottomNavProps) {
  return (
    <nav 
      aria-label="모바일 하단 네비게이션"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 px-3 py-1.5 pb-safe transition-colors shadow-lg"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        
        {/* Tab 1: Home/All */}
        <button
          onClick={() => onSelectStatus('all')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all min-h-[48px] min-w-[56px] ${
            selectedStatus === 'all'
              ? 'text-indigo-600 dark:text-indigo-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 font-medium'
          }`}
        >
          <Home className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">전체목록</span>
        </button>

        {/* Tab 2: My 찜/짐 */}
        <button
          onClick={() => onSelectStatus('my_items')}
          className={`relative flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all min-h-[48px] min-w-[56px] ${
            selectedStatus === 'my_items'
              ? 'text-indigo-600 dark:text-indigo-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 font-medium'
          }`}
        >
          <Bookmark className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">내가 찜한것</span>
          {myPledgedCount > 0 && (
            <span className="absolute top-1 right-2.5 w-4 h-4 rounded-full bg-indigo-600 text-white text-[9px] font-bold flex items-center justify-center">
              {myPledgedCount}
            </span>
          )}
        </button>

        {/* Center: Add Button */}
        <button
          onClick={onOpenAddModal}
          className="flex flex-col items-center justify-center -mt-5"
          aria-label="준비물 추가"
        >
          <div className="w-13 h-13 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/30 flex items-center justify-center p-3 active:scale-90 transition-all border-2 border-white dark:border-slate-900">
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </div>
          <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
            추가
          </span>
        </button>

        {/* Tab 4: Incomplete/Needs attention */}
        <button
          onClick={() => onSelectStatus('incomplete')}
          className={`relative flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all min-h-[48px] min-w-[56px] ${
            selectedStatus === 'incomplete'
              ? 'text-amber-600 dark:text-amber-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 font-medium'
          }`}
        >
          <AlertTriangle className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">부족/미정</span>
          {incompleteCount > 0 && (
            <span className="absolute top-1 right-2.5 w-4 h-4 rounded-full bg-amber-500 text-white text-[9px] font-bold flex items-center justify-center">
              {incompleteCount}
            </span>
          )}
        </button>

        {/* Tab 5: Report */}
        <button
          onClick={onOpenReportModal}
          className="flex flex-col items-center justify-center py-1 px-2 rounded-xl text-slate-500 dark:text-slate-400 font-medium min-h-[48px] min-w-[56px]"
        >
          <FileText className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">현황보고</span>
        </button>

      </div>
    </nav>
  );
}
