'use client';

import React from 'react';
import { X, Database, CheckCircle2, AlertTriangle, RotateCcw } from 'lucide-react';

interface VercelStorageGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  storageType: 'redis' | 'local_file' | 'in_memory';
  onResetData: () => void;
}

export default function VercelStorageGuideModal({
  isOpen,
  onClose,
  storageType,
  onResetData,
}: VercelStorageGuideModalProps) {
  if (!isOpen) return null;

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
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xl">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Vercel 배포 및 실시간 동기화 안내
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              여러 명이 접속하여 실시간으로 체크 현황을 공유하는 방법입니다.
            </p>
          </div>
        </div>

        {/* Current Status Box */}
        <div className={`p-4 rounded-2xl border mb-5 ${
          storageType === 'redis'
            ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
            : storageType === 'local_file'
            ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200'
            : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200'
        }`}>
          <div className="flex items-center gap-2 font-bold text-xs">
            {storageType === 'redis' ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>🟢 Vercel KV / Upstash 실시간 클라우드 DB 연결됨</span>
              </>
            ) : storageType === 'local_file' ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>📁 로컬 파일 저장소 모드 (data/party-data.json)</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>⚡ 데모 / 인메모리 모드로 실행 중</span>
              </>
            )}
          </div>
          <p className="text-xs mt-1.5 opacity-90 leading-relaxed">
            {storageType === 'redis'
              ? '모든 참가자가 스마트폰이나 브라우저에서 체크하면 실시간으로 클라우드에 영구 저장됩니다.'
              : storageType === 'local_file'
              ? '로컬 개발 환경에서는 파일로 안전하게 저장됩니다. Vercel 배포 후에는 아래 가이드대로 Vercel KV를 1클릭 연결할 수 있습니다.'
              : '현재 환경 변수가 없어 세션 기반으로 동작 중입니다. 아래 단계를 따라 Vercel KV를 연결하면 모든 참가자의 데이터가 완벽 동기화됩니다.'}
          </p>
        </div>

        {/* 1-Minute Vercel Guide */}
        <div className="space-y-3 mb-6">
          <h3 className="font-bold text-xs text-slate-800 dark:text-slate-200">
            🚀 1분 만에 Vercel 무료 클라우드 동기화 연결하기
          </h3>

          <ol className="text-xs text-slate-600 dark:text-slate-400 space-y-2.5 pl-4 list-decimal leading-relaxed">
            <li>
              이 프로젝트를 <strong>GitHub 저장소에 Push</strong>하고 Vercel에 Import합니다.
            </li>
            <li>
              Vercel 대시보드 상단 <strong>Storage</strong> 탭 클릭 후 <strong>Create Database</strong>를 누릅니다.
            </li>
            <li>
              <strong>KV</strong> (또는 Marketplace의 <strong>Upstash Redis</strong> 무료 플랜)를 선택하고 생성합니다.
            </li>
            <li>
              프로젝트와 <strong>Connect</strong>하면 환경변수(<code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-[11px]">KV_REST_API_URL</code>, <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-[11px]">KV_REST_API_TOKEN</code>)가 자동 주입됩니다!
            </li>
            <li>
              배포된 사이트 URL을 친구들에게 공유하면 끝! 🎉
            </li>
          </ol>
        </div>

        {/* Reset button */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            초기 상태로 되돌리고 싶으신가요?
          </div>
          <button
            onClick={() => {
              if (confirm('모든 준비물과 체크 현황을 초기 상태로 리셋하시겠습니까?')) {
                onResetData();
                onClose();
              }
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-800 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>초기 데이터로 리셋</span>
          </button>
        </div>

      </div>
    </div>
  );
}
