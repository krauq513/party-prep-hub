'use client';

import React from 'react';
import { PartyItem, Participant } from '@/types/party';
import { 
  AlertTriangle, 
  Package, 
  UserCheck, 
  Sparkles,
  ShoppingBag
} from 'lucide-react';

interface StatsDashboardProps {
  items: PartyItem[];
  participants: Participant[];
  currentParticipant: Participant;
  onFilterMissing: () => void;
  onFilterMyItems: () => void;
}

export default function StatsDashboard({
  items,
  participants,
  currentParticipant,
  onFilterMissing,
  onFilterMyItems,
}: StatsDashboardProps) {
  // 1. Personal items stats
  const personalItems = items.filter((i) => i.type === 'personal');
  const totalPersonalChecks = personalItems.length * (participants.length || 1);
  const donePersonalChecks = personalItems.reduce((acc, item) => {
    return acc + (item.completedBy?.length || 0);
  }, 0);
  const personalRate = totalPersonalChecks > 0 ? Math.round((donePersonalChecks / totalPersonalChecks) * 100) : 100;

  // Current participant personal done
  const myPersonalDone = personalItems.filter((i) => i.completedBy?.includes(currentParticipant.id)).length;
  const myPersonalRate = personalItems.length > 0 ? Math.round((myPersonalDone / personalItems.length) * 100) : 100;

  // 2. Shared single items stats
  const sharedSingleItems = items.filter((i) => i.type === 'shared_single');
  const sharedSingleAssigned = sharedSingleItems.filter((i) => !!i.assigneeId).length;
  const sharedSingleDone = sharedSingleItems.filter((i) => i.isCompleted).length;

  // 3. Shared quantity items stats
  const sharedQuantityItems = items.filter((i) => i.type === 'shared_quantity');
  let quantityMetCount = 0;
  let totalTargetSum = 0;
  let totalCurrentSum = 0;

  sharedQuantityItems.forEach((item) => {
    const target = item.targetQuantity || 1;
    const current = (item.contributions || []).reduce((acc, c) => acc + c.quantity, 0);
    totalTargetSum += target;
    totalCurrentSum += Math.min(current, target);
    if (current >= target) {
      quantityMetCount++;
    }
  });

  const quantityRate = totalTargetSum > 0 ? Math.round((totalCurrentSum / totalTargetSum) * 100) : 100;

  // Count items with missing assignment or unmet quantity
  const missingSingleCount = sharedSingleItems.filter((i) => !i.assigneeId).length;
  const missingQuantityCount = sharedQuantityItems.filter((i) => {
    const current = (i.contributions || []).reduce((acc, c) => acc + c.quantity, 0);
    return current < (i.targetQuantity || 1);
  }).length;
  const totalMissingShared = missingSingleCount + missingQuantityCount;

  // Overall Party Readiness (weighted average of components)
  const totalCoreItems = personalItems.length + sharedSingleItems.length + sharedQuantityItems.length;
  const personalScore = personalItems.length * (personalRate / 100);
  const singleScore = sharedSingleItems.length * (sharedSingleDone / (sharedSingleItems.length || 1));
  const quantityScore = sharedQuantityItems.length * (quantityRate / 100);
  const overallRate = totalCoreItems > 0 
    ? Math.round(((personalScore + singleScore + quantityScore) / totalCoreItems) * 100) 
    : 0;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/90 dark:border-slate-800 shadow-sm transition-colors mb-6">
      
      {/* Top Banner: Overall Readiness */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">📊</span>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              전체 파티 준비 현황
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              {overallRate >= 100 ? '🎉 준비 100% 완료!' : `${overallRate}% 달성`}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            개인 필수품, 공용 담당, 수량 목표 항목을 종합한 실시간 완료율입니다.
          </p>
        </div>

        {/* Quick badge action */}
        {totalMissingShared > 0 ? (
          <button
            onClick={onFilterMissing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 text-xs font-semibold hover:bg-amber-100 transition-colors self-start sm:self-auto"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>부족/미정 항목 {totalMissingShared}개 확인하기</span>
          </button>
        ) : (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 text-xs font-semibold self-start sm:self-auto">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>공용 물품이 모두 채워졌습니다!</span>
          </div>
        )}
      </div>

      {/* Main Progress Bar */}
      <div className="mt-5">
        <div className="flex justify-between items-center text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
          <span>종합 준비 진척도</span>
          <span className="text-slate-900 dark:text-white font-bold text-sm">{overallRate}%</span>
        </div>
        <div className="w-full h-3.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200/60 dark:border-slate-700/60">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-700 ease-out shadow-sm"
            style={{ width: `${Math.min(overallRate, 100)}%` }}
          />
        </div>
      </div>

      {/* 4 Detail Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-5">
        
        {/* Card 1: My Personal Checklist */}
        <div 
          onClick={onFilterMyItems}
          className="p-3.5 sm:p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-700 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">내 준비 상태</span>
            <span className="text-lg">{currentParticipant.avatar}</span>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {myPersonalDone}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              / {personalItems.length}개 ({myPersonalRate}%)
            </span>
          </div>
          <div className="text-[11px] text-indigo-600 dark:text-indigo-400 mt-1 font-medium group-hover:underline">
            {currentParticipant.name}님 체크리스트 보기 →
          </div>
        </div>

        {/* Card 2: Personal Essentials Overall */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">개인 필수품</span>
            <UserCheck className="w-4 h-4 text-slate-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
              개인별 관리
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              (비공개)
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            수건, 세면도구 등 각자 본인만 확인
          </p>
        </div>

        {/* Card 3: Shared Single Items */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">공용 단일 품목</span>
            <Package className="w-4 h-4 text-slate-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {sharedSingleAssigned}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              / {sharedSingleItems.length}건 배정 ({sharedSingleDone}건 완료)
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            보드게임, 상비약, 양주(협찬) 등
          </p>
        </div>

        {/* Card 4: Shared Quantity Items */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">수량 목표 품목</span>
            <ShoppingBag className="w-4 h-4 text-slate-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {quantityMetCount}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              / {sharedQuantityItems.length}품목 충족 ({quantityRate}%)
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            고기, 소주, 맥주, 식기류 등
          </p>
        </div>

      </div>
    </div>
  );
}
