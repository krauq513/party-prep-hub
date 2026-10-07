'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PartyData, PartyItem, Participant, FilterCategory, FilterType, FilterStatus, CustomSubItem } from '@/types/party';
import { INITIAL_PARTY_DATA, INITIAL_PARTICIPANTS } from '@/data/initialData';
import Header from '@/components/Header';
import StatsDashboard from '@/components/StatsDashboard';
import FilterBar from '@/components/FilterBar';
import ItemCard from '@/components/ItemCard';
import AddItemModal from '@/components/AddItemModal';
import ParticipantModal from '@/components/ParticipantModal';
import ReportModal from '@/components/ReportModal';
import PledgeModal from '@/components/PledgeModal';
import MobileBottomNav from '@/components/MobileBottomNav';
import WelcomeSelectModal from '@/components/WelcomeSelectModal';
import TrashModal from '@/components/TrashModal';
import { Plus } from 'lucide-react';

const LOCAL_STORAGE_USER_KEY = 'party_current_participant_id_v2';

export default function PartyPrepPage() {
  const [partyData, setPartyData] = useState<PartyData>(INITIAL_PARTY_DATA);
  const [currentParticipant, setCurrentParticipant] = useState<Participant>(INITIAL_PARTICIPANTS[0]);
  const [isLoading, setIsLoading] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>('전체');
  const [selectedType, setSelectedType] = useState<FilterType>('all');
  const [selectedStatus, setSelectedStatus] = useState<FilterStatus>('all');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<PartyItem | null>(null);
  const [isParticipantModalOpen, setIsParticipantModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isTrashModalOpen, setIsTrashModalOpen] = useState(false);

  // 웰컴 (첫 접속자 이름 선택) Modal
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState(false);

  // 찜하기 (Pledge) Modal
  const [isPledgeModalOpen, setIsPledgeModalOpen] = useState(false);
  const [pledgeTargetItem, setPledgeTargetItem] = useState<PartyItem | null>(null);

  // Load local cache immediately on mount for instant zero-flicker display
  useEffect(() => {
    try {
      const cached = localStorage.getItem('party_prep_hub_cached_data_v2');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.items) {
          setPartyData(parsed);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Sync state to local cache whenever partyData changes
  useEffect(() => {
    if (partyData && partyData.items && partyData.items.length > 0) {
      try {
        localStorage.setItem('party_prep_hub_cached_data_v2', JSON.stringify(partyData));
      } catch {
        // ignore
      }
    }
  }, [partyData]);

  // 1. Load initial data & saved user
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/party?t=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setPartyData(json.data);
          try {
            localStorage.setItem('party_prep_hub_cached_data_v2', JSON.stringify(json.data));
          } catch {
            // ignore
          }

          // Restore saved user or open welcome modal
          const savedUserId = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
          if (savedUserId) {
            const found = json.data.participants.find((p: Participant) => p.id === savedUserId);
            if (found) {
              setCurrentParticipant(found);
            } else {
              setIsWelcomeModalOpen(true);
            }
          } else {
            // First time visitor: show welcome modal
            setIsWelcomeModalOpen(true);
          }
        }
      }
    } catch (err) {
      console.warn('Fetch party data failed, using offline cache fallback:', err);
      try {
        const cached = localStorage.getItem('party_prep_hub_cached_data_v2');
        if (cached) {
          const local = JSON.parse(cached);
          if (local && local.items) {
            setPartyData(local);
          }
        }
      } catch {
        // ignore
      }
      const savedUserId = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
      if (!savedUserId) {
        setIsWelcomeModalOpen(true);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle participant change
  const handleSelectParticipant = (p: Participant) => {
    setCurrentParticipant(p);
    localStorage.setItem(LOCAL_STORAGE_USER_KEY, p.id);
  };

  const handleWelcomeSelect = (p: Participant) => {
    handleSelectParticipant(p);
    setIsWelcomeModalOpen(false);
  };

  // Helper to send backend updates
  const sendAction = async (action: string, payload: unknown) => {
    try {
      const res = await fetch('/api/party', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setPartyData(json.data);
          try {
            localStorage.setItem('party_prep_hub_cached_data_v2', JSON.stringify(json.data));
          } catch {
            // ignore
          }
        }
      }
    } catch (err) {
      console.error('Failed to update action:', err);
    }
  };

  // --- Actions ---

  const handleTogglePersonal = (itemId: string, participantId: string) => {
    setPartyData((prev) => ({
      ...prev,
      items: prev.items.map((item) => {
        if (item.id !== itemId) return item;
        const currentList = item.completedBy || [];
        const exists = currentList.includes(participantId);
        const newList = exists
          ? currentList.filter((id) => id !== participantId)
          : [...currentList, participantId];
        return {
          ...item,
          completedBy: newList,
          isCompleted: newList.length > 0,
        };
      }),
    }));

    sendAction('toggle_personal', { itemId, participantId });
  };

  const handleClaimSharedSingle = (itemId: string, participantId: string, participantName: string) => {
    setPartyData((prev) => ({
      ...prev,
      items: prev.items.map((item) => {
        if (item.id !== itemId) return item;
        const currentAssignees = item.assignees || (item.assigneeId ? [{ id: item.assigneeId, name: item.assigneeName || '' }] : []);
        const exists = currentAssignees.some((a) => a.id === participantId);
        const newAssignees = exists
          ? currentAssignees.filter((a) => a.id !== participantId)
          : [...currentAssignees, { id: participantId, name: participantName }];

        const newCompletedBy = exists
          ? (item.completedBy || []).filter((id) => id !== participantId)
          : (item.completedBy || []);

        const nextGames = exists
          ? (item.boardGames || []).filter((g) => g.participantId !== participantId)
          : (item.boardGames || []);

        const nextSubs = exists
          ? (item.subItems || []).filter((s) => s.participantId !== participantId)
          : (item.subItems || []);

        return {
          ...item,
          assignees: newAssignees,
          assigneeId: newAssignees.length > 0 ? newAssignees[0].id : undefined,
          assigneeName: newAssignees.length > 0 ? newAssignees[0].name : undefined,
          completedBy: newCompletedBy,
          boardGames: nextGames,
          subItems: nextSubs,
          isCompleted: newAssignees.length > 0 || nextGames.length > 0 || nextSubs.length > 0,
        };
      }),
    }));

    sendAction('claim_shared_single', { itemId, participantId, participantName });
  };

  const handleToggleSharedComplete = (itemId: string) => {
    setPartyData((prev) => ({
      ...prev,
      items: prev.items.map((item) => {
        if (item.id !== itemId) return item;
        return { ...item, isCompleted: !item.isCompleted };
      }),
    }));

    sendAction('toggle_shared_complete', { itemId });
  };

  // 찜하기 모달 열기
  const handleOpenPledgeModal = (item: PartyItem) => {
    setPledgeTargetItem(item);
    setIsPledgeModalOpen(true);
  };

  // 찜하기 저장
  const handleSavePledge = (
    itemId: string,
    quantity: number,
    note?: string,
    selectedVarieties?: string[]
  ) => {
    setPartyData((prev) => ({
      ...prev,
      items: prev.items.map((item) => {
        if (item.id !== itemId) return item;
        const currentContribs = item.contributions || [];
        const existingIndex = currentContribs.findIndex((c) => c.participantId === currentParticipant.id);

        const newContribs = [...currentContribs];
        if (existingIndex >= 0) {
          newContribs[existingIndex] = {
            participantId: currentParticipant.id,
            participantName: currentParticipant.name,
            quantity,
            note,
          };
        } else {
          newContribs.push({
            participantId: currentParticipant.id,
            participantName: currentParticipant.name,
            quantity,
            note,
          });
        }

        // 선택된 종류가 전달된 경우 subItems 동기화
        let nextSubs = item.subItems || [];
        if (Array.isArray(selectedVarieties)) {
          const otherSubs = nextSubs.filter((s) => s.participantId !== currentParticipant.id);
          const myNewSubs: CustomSubItem[] = selectedVarieties
            .map((n) => (n || '').trim())
            .filter(Boolean)
            .map((n, idx) => ({
              id: `sub-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
              name: n,
              participantId: currentParticipant.id,
              participantName: currentParticipant.name,
              createdAt: new Date().toISOString(),
            }));
          nextSubs = [...otherSubs, ...myNewSubs];
        }

        return { ...item, contributions: newContribs, subItems: nextSubs };
      }),
    }));

    sendAction('update_quantity_contribution', {
      itemId,
      participantId: currentParticipant.id,
      participantName: currentParticipant.name,
      quantity,
      note,
      subItemNames: selectedVarieties,
    });
  };

  // 찜하기 취소 (0개로 변경 및 모든 참여 내역 완전 삭제)
  const handleCancelPledge = (itemId: string) => {
    setPartyData((prev) => ({
      ...prev,
      items: prev.items.map((item) => {
        if (item.id !== itemId) return item;
        const currentAssignees = item.assignees || (item.assigneeId ? [{ id: item.assigneeId, name: item.assigneeName || '' }] : []);
        const nextAssignees = currentAssignees.filter((a) => a.id !== currentParticipant.id);
        const nextGames = (item.boardGames || []).filter((g) => g.participantId !== currentParticipant.id);
        const nextSubs = (item.subItems || []).filter((s) => s.participantId !== currentParticipant.id);
        const nextContribs = (item.contributions || []).filter((c) => c.participantId !== currentParticipant.id);
        const nextCompleted = (item.completedBy || []).filter((id) => id !== currentParticipant.id);

        let isCompleted = false;
        if (item.type === 'personal') {
          isCompleted = nextCompleted.length > 0;
        } else if (item.type === 'shared_single') {
          isCompleted = nextAssignees.length > 0 || nextGames.length > 0 || nextSubs.length > 0;
        } else if (item.type === 'shared_quantity') {
          const currentTotal = nextContribs.reduce((sum, c) => sum + c.quantity, 0);
          isCompleted = currentTotal >= (item.targetQuantity || 1);
        }

        return {
          ...item,
          assignees: nextAssignees,
          assigneeId: nextAssignees[0]?.id,
          assigneeName: nextAssignees[0]?.name,
          boardGames: nextGames,
          subItems: nextSubs,
          contributions: nextContribs,
          completedBy: nextCompleted,
          isCompleted,
        };
      }),
    }));

    sendAction('cancel_pledge', {
      itemId,
      participantId: currentParticipant.id,
    });
  };

  // 목표 수량 즉시 변경
  const handleUpdateTargetQuantity = (itemId: string, newTarget: number) => {
    if (newTarget < 1) return;
    setPartyData((prev) => ({
      ...prev,
      items: prev.items.map((item) => (item.id === itemId ? { ...item, targetQuantity: newTarget } : item)),
    }));
    sendAction('edit_item', { id: itemId, updates: { targetQuantity: newTarget } });
  };

  const handleSaveItem = (itemPayload: Partial<PartyItem>) => {
    if (editItem) {
      sendAction('edit_item', { id: editItem.id, updates: itemPayload });
      setEditItem(null);
    } else {
      sendAction('add_item', itemPayload);
    }
  };

  const handleDeleteItem = (itemId: string) => {
    const itemToDelete = partyData.items.find((i) => i.id === itemId);
    if (!itemToDelete) return;
    setPartyData((prev) => ({
      ...prev,
      items: prev.items.filter((i) => i.id !== itemId),
      deletedItems: [itemToDelete, ...(prev.deletedItems || [])],
    }));
    sendAction('delete_item', { itemId });
  };

  const handleRestoreItem = (itemId: string) => {
    const itemToRestore = (partyData.deletedItems || []).find((i) => i.id === itemId);
    if (!itemToRestore) return;
    setPartyData((prev) => ({
      ...prev,
      deletedItems: (prev.deletedItems || []).filter((i) => i.id !== itemId),
      items: [itemToRestore, ...prev.items],
    }));
    sendAction('restore_item', { itemId });
  };

  const handleClearTrash = () => {
    setPartyData((prev) => ({
      ...prev,
      deletedItems: [],
    }));
    sendAction('clear_trash', {});
  };

  const handleSaveSubItem = (itemId: string, name: string, participantId: string, participantName: string) => {
    const parts = (name || '')
      .split(/[,/]/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length === 0) return;

    setPartyData((prev) => ({
      ...prev,
      items: prev.items.map((item) => {
        if (item.id !== itemId) return item;
        const currentSubs = item.subItems || [];

        const newSubs: CustomSubItem[] = [];
        for (let i = 0; i < parts.length; i++) {
          const p = parts[i];
          const exists = currentSubs.some(
            (cs) => cs.participantId === participantId && cs.name.trim().toLowerCase() === p.toLowerCase()
          );
          if (!exists) {
            newSubs.push({
              id: `sub-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
              name: p,
              participantId,
              participantName,
              createdAt: new Date().toISOString(),
            });
          }
        }

        if (newSubs.length === 0) return item;
        const nextSubs = [...currentSubs, ...newSubs];

        // If shared_quantity, also ensure contribution quantity >= mySubCount
        let nextContribs = item.contributions || [];
        if (item.type === 'shared_quantity') {
          const mySubCount = nextSubs.filter((s) => s.participantId === participantId).length;
          const existingIdx = nextContribs.findIndex((c) => c.participantId === participantId);
          if (existingIdx >= 0) {
            nextContribs = [...nextContribs];
            nextContribs[existingIdx] = {
              ...nextContribs[existingIdx],
              quantity: Math.max(nextContribs[existingIdx].quantity, mySubCount),
            };
          } else {
            nextContribs = [
              ...nextContribs,
              {
                participantId,
                participantName,
                quantity: mySubCount,
              },
            ];
          }
        }

        // If board game, also sync boardGames
        let nextGames = item.name.includes('보드게임') ? (item.boardGames || []) : [];
        if (item.name.includes('보드게임')) {
          const gamesToAdd = newSubs.map((ns) => ({
            id: ns.id,
            gameName: ns.name,
            participantId,
            participantName,
            createdAt: ns.createdAt,
          }));
          nextGames = [...nextGames, ...gamesToAdd];
        }

        // If shared_single, ensure participant is in assignees
        let nextAssignees = item.assignees || (item.assigneeId ? [{ id: item.assigneeId, name: item.assigneeName || '' }] : []);
        if (item.type === 'shared_single') {
          if (!nextAssignees.some((a) => a.id === participantId)) {
            nextAssignees = [...nextAssignees, { id: participantId, name: participantName }];
          }
        }

        return {
          ...item,
          subItems: nextSubs,
          boardGames: nextGames,
          contributions: nextContribs,
          assignees: nextAssignees,
          assigneeId: nextAssignees[0]?.id,
          assigneeName: nextAssignees[0]?.name,
          isCompleted: item.type === 'shared_single' ? true : item.isCompleted,
        };
      }),
    }));

    sendAction('add_sub_item', { itemId, names: parts, participantId, participantName });
  };

  const handleSaveBoardGame = (itemId: string, gameName: string, participantId: string, participantName: string) => {
    handleSaveSubItem(itemId, gameName, participantId, participantName);
  };

  const handleRemoveBoardGame = (itemId: string, gameId: string) => {
    handleRemoveSubItem(itemId, gameId);
  };

  const handleRemoveSubItem = (itemId: string, subId: string) => {
    setPartyData((prev) => ({
      ...prev,
      items: prev.items.map((item) => {
        if (item.id !== itemId) return item;
        const prevSubs = item.subItems || [];
        const nextSubs = prevSubs.filter((s) => s.id !== subId);
        const deletedSub = prevSubs.find((s) => s.id === subId);

        let nextContribs = item.contributions || [];
        if (deletedSub && item.type === 'shared_quantity') {
          const pId = deletedSub.participantId;
          const remainingCount = nextSubs.filter((s) => s.participantId === pId).length;
          const prevCount = prevSubs.filter((s) => s.participantId === pId).length;
          const existing = nextContribs.find((c) => c.participantId === pId);
          if (existing && existing.quantity <= prevCount) {
            if (remainingCount === 0) {
              nextContribs = nextContribs.filter((c) => c.participantId !== pId);
            } else {
              nextContribs = nextContribs.map((c) =>
                c.participantId === pId ? { ...c, quantity: remainingCount } : c
              );
            }
          }
        }

        const nextGames = (item.boardGames || []).filter((g) => g.id !== subId);

        let nextAssignees = item.assignees || [];
        if (item.type === 'shared_single' && deletedSub) {
          const pId = deletedSub.participantId;
          const hasOtherSubs = nextSubs.some((s) => s.participantId === pId);
          const hasOtherGames = nextGames.some((g) => g.participantId === pId);
          if (!hasOtherSubs && !hasOtherGames) {
            nextAssignees = nextAssignees.filter((a) => a.id !== pId);
          }
        }

        return {
          ...item,
          subItems: nextSubs,
          boardGames: nextGames,
          contributions: nextContribs,
          assignees: nextAssignees,
          assigneeId: nextAssignees[0]?.id,
          assigneeName: nextAssignees[0]?.name,
          isCompleted: item.type === 'shared_single' ? (nextAssignees.length > 0 || nextGames.length > 0) : item.isCompleted,
        };
      }),
    }));

    sendAction('remove_sub_item', { itemId, subItemId: subId });
  };

  const handleAddParticipant = (name: string, avatar: string) => {
    sendAction('add_participant', {
      name,
      avatar,
      color: '#3b82f6',
    });
  };

  // --- Counts for Badges ---
  const myPledgedCount = partyData.items.filter((item) => {
    if (item.type === 'personal') return (item.completedBy || []).includes(currentParticipant.id);
    if (item.type === 'shared_single') {
      const assignees = item.assignees || (item.assigneeId ? [{ id: item.assigneeId, name: item.assigneeName || '' }] : []);
      const inAssignees = assignees.some((a) => a.id === currentParticipant.id);
      const inGames = (item.boardGames || []).some((bg) => bg.participantId === currentParticipant.id);
      const inSubs = (item.subItems || []).some((s) => s.participantId === currentParticipant.id);
      return inAssignees || inGames || inSubs;
    }
    if (item.type === 'shared_quantity') {
      const inContribs = (item.contributions || []).some((c) => c.participantId === currentParticipant.id);
      const inSubs = (item.subItems || []).some((s) => s.participantId === currentParticipant.id);
      return inContribs || inSubs;
    }
    return false;
  }).length;

  const incompleteCount = partyData.items.filter((item) => {
    if (item.type === 'personal') return !(item.completedBy || []).includes(currentParticipant.id);
    if (item.type === 'shared_single') {
      const assignees = item.assignees || (item.assigneeId ? [{ id: item.assigneeId, name: item.assigneeName || '' }] : []);
      const boardGames = item.boardGames || [];
      const hasPledge = assignees.length > 0 || boardGames.length > 0;
      return !hasPledge || !item.isCompleted;
    }
    if (item.type === 'shared_quantity') {
      const sum = (item.contributions || []).reduce((acc, c) => acc + c.quantity, 0);
      return sum < (item.targetQuantity || 1);
    }
    return false;
  }).length;

  // --- Filtering Logic ---
  const filteredItems = partyData.items.filter((item) => {
    // 1. Search Query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      const matchName = item.name.toLowerCase().includes(query);
      const matchCategory = item.category.toLowerCase().includes(query);
      const matchNotes = item.notes?.toLowerCase().includes(query);
      const matchAssignee = (item.assignees || []).some((a) => a.name.toLowerCase().includes(query)) || item.assigneeName?.toLowerCase().includes(query);
      const matchContrib = item.contributions?.some((c) => c.participantName.toLowerCase().includes(query));
      const matchBoardGame = (item.boardGames || []).some((bg) => bg.gameName.toLowerCase().includes(query) || bg.participantName.toLowerCase().includes(query));
      if (!matchName && !matchCategory && !matchNotes && !matchAssignee && !matchContrib && !matchBoardGame) {
        return false;
      }
    }

    // 2. Category Filter
    if (selectedCategory !== '전체' && item.category !== selectedCategory) {
      return false;
    }

    // 3. Type Filter
    if (selectedType !== 'all' && item.type !== selectedType) {
      return false;
    }

    // 4. Status Filter
    if (selectedStatus === 'my_items') {
      if (item.type === 'personal') {
        return true;
      }
      if (item.type === 'shared_single') {
        const assignees = item.assignees || (item.assigneeId ? [{ id: item.assigneeId, name: item.assigneeName || '' }] : []);
        const inAssignees = assignees.some((a) => a.id === currentParticipant.id);
        const inGames = (item.boardGames || []).some((bg) => bg.participantId === currentParticipant.id);
        return inAssignees || inGames;
      }
      if (item.type === 'shared_quantity') {
        return item.contributions?.some((c) => c.participantId === currentParticipant.id);
      }
    }

    if (selectedStatus === 'incomplete') {
      if (item.type === 'personal') {
        return !(item.completedBy || []).includes(currentParticipant.id);
      }
      if (item.type === 'shared_single') {
        const assignees = item.assignees || (item.assigneeId ? [{ id: item.assigneeId, name: item.assigneeName || '' }] : []);
        const boardGames = item.boardGames || [];
        const hasPledge = assignees.length > 0 || boardGames.length > 0;
        return !hasPledge || !item.isCompleted;
      }
      if (item.type === 'shared_quantity') {
        const currentSum = (item.contributions || []).reduce((acc, c) => acc + c.quantity, 0);
        return currentSum < (item.targetQuantity || 1);
      }
    }

    return true;
  });

  const categoriesInOrder: FilterCategory[] = [
    '개인필수',
    '식기',
    '고기/메인',
    '채소/곁들임',
    '양념/소스',
    '주류/음료',
    '식사/안주',
    '오락/비상용품',
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors pb-28 md:pb-16">
      
      {/* Header */}
      <Header
        title={partyData.title}
        eventDate={partyData.eventDate}
        location={partyData.location}
        naverMapUrl={partyData.naverMapUrl}
        kakaoMapUrl={partyData.kakaoMapUrl}
        participants={partyData.participants}
        currentParticipant={currentParticipant}
        onSelectParticipant={handleSelectParticipant}
        onOpenAddModal={() => {
          setEditItem(null);
          setIsAddModalOpen(true);
        }}
        onOpenReportModal={() => setIsReportModalOpen(true)}
        onOpenParticipantModal={() => setIsParticipantModalOpen(true)}
        onRefresh={fetchData}
        isLoading={isLoading}
      />

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-2.5 py-3 sm:px-6 sm:py-6">
        
        {/* Overall Stats Dashboard */}
        <StatsDashboard
          items={partyData.items}
          participants={partyData.participants}
          currentParticipant={currentParticipant}
          onFilterMissing={() => {
            setSelectedStatus('incomplete');
            setSelectedCategory('전체');
          }}
          onFilterMyItems={() => {
            setSelectedStatus('my_items');
            setSelectedCategory('전체');
          }}
        />

        {/* Filter Bar */}
        <FilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          selectedType={selectedType}
          onSelectType={setSelectedType}
          selectedStatus={selectedStatus}
          onSelectStatus={setSelectedStatus}
          filteredCount={filteredItems.length}
          totalCount={partyData.items.length}
        />

        {/* Items List */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-16 px-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
            <div className="text-4xl mb-3">🔍</div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              일치하는 준비물이 없습니다
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              검색어나 필터 조건을 변경하거나 새 준비물을 추가해보세요.
            </p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('전체');
                  setSelectedStatus('all');
                  setSelectedType('all');
                }}
                className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 transition-colors"
              >
                필터 초기화
              </button>
              <button
                onClick={() => {
                  setEditItem(null);
                  setIsAddModalOpen(true);
                }}
                className="px-3.5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-colors"
              >
                + 준비물 추가하기
              </button>
            </div>
          </div>
        ) : selectedCategory === '전체' && !searchQuery ? (
          // Grouped Display by Category
          <div className="space-y-6 sm:space-y-8">
            {categoriesInOrder.map((cat) => {
              const categoryItems = filteredItems.filter((i) => i.category === cat);
              if (categoryItems.length === 0) return null;

              return (
                <section key={cat} className="space-y-2.5 sm:space-y-3">
                  <div className="flex items-center gap-2 pb-1 border-b border-slate-200/80 dark:border-slate-800">
                    <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                      {cat}
                    </h3>
                    <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {categoryItems.length}개
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:gap-4">
                    {categoryItems.map((item) => (
                      <ItemCard
                        key={item.id}
                        item={item}
                        participants={partyData.participants}
                        currentParticipant={currentParticipant}
                        onTogglePersonal={handleTogglePersonal}
                        onClaimSharedSingle={handleClaimSharedSingle}
                        onToggleSharedComplete={handleToggleSharedComplete}
                        onOpenPledgeModal={handleOpenPledgeModal}
                        onCancelPledge={handleCancelPledge}
                        onDeleteItem={handleDeleteItem}
                        onEditItem={(item) => {
                          setEditItem(item);
                          setIsAddModalOpen(true);
                        }}
                        onUpdateTargetQuantity={handleUpdateTargetQuantity}
                        onAddBoardGame={handleSaveBoardGame}
                        onRemoveBoardGame={handleRemoveBoardGame}
                        onAddSubItem={handleSaveSubItem}
                        onRemoveSubItem={handleRemoveSubItem}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        ) : (
          // Flat List for filtered or searched view
          <div className="grid grid-cols-2 gap-2 sm:gap-4">
            {filteredItems.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                participants={partyData.participants}
                currentParticipant={currentParticipant}
                onTogglePersonal={handleTogglePersonal}
                onClaimSharedSingle={handleClaimSharedSingle}
                onToggleSharedComplete={handleToggleSharedComplete}
                onOpenPledgeModal={handleOpenPledgeModal}
                onCancelPledge={handleCancelPledge}
                onDeleteItem={handleDeleteItem}
                onEditItem={(item) => {
                  setEditItem(item);
                  setIsAddModalOpen(true);
                }}
                onUpdateTargetQuantity={handleUpdateTargetQuantity}
                onAddBoardGame={handleSaveBoardGame}
                onRemoveBoardGame={handleRemoveBoardGame}
                onAddSubItem={handleSaveSubItem}
                onRemoveSubItem={handleRemoveSubItem}
              />
            ))}
          </div>
        )}

        {/* 하단 복구용 휴지통 영역 */}
        <div className="mt-12 pt-6 border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span>실수로 준비물을 삭제하셨나요?</span>
            <button
              onClick={() => setIsTrashModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-200/70 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-bold text-slate-700 dark:text-slate-300 transition-colors shadow-sm active:scale-95"
            >
              <span>🗑️ 휴지통</span>
              {(partyData.deletedItems || []).length > 0 && (
                <span className="px-1.5 py-0.5 bg-rose-500 text-white rounded-full text-[10px] font-black">
                  {(partyData.deletedItems || []).length}
                </span>
              )}
            </button>
          </div>
          <div className="font-medium text-slate-400 dark:text-slate-500 text-[11px]">
            언제든 휴지통에서 삭제한 항목을 원래대로 복구할 수 있습니다
          </div>
        </div>

      </main>

      {/* Floating Add Button for Desktop */}
      <button
        onClick={() => {
          setEditItem(null);
          setIsAddModalOpen(true);
        }}
        className="hidden md:flex fixed bottom-8 right-8 px-4 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-xl shadow-indigo-600/30 items-center gap-2 font-bold text-sm active:scale-95 transition-all z-30"
        aria-label="준비물 추가"
      >
        <Plus className="w-5 h-5" />
        <span>새 준비물 추가</span>
      </button>

      {/* Mobile Sticky Bottom Navigation Bar */}
      <MobileBottomNav
        selectedStatus={selectedStatus}
        onSelectStatus={setSelectedStatus}
        onOpenAddModal={() => {
          setEditItem(null);
          setIsAddModalOpen(true);
        }}
        onOpenReportModal={() => setIsReportModalOpen(true)}
        myPledgedCount={myPledgedCount}
        incompleteCount={incompleteCount}
      />

      {/* 웰컴 모달 (첫 방문자 본인 선택 & 캐시 등록) */}
      <WelcomeSelectModal
        isOpen={isWelcomeModalOpen}
        participants={partyData.participants}
        onSelect={handleWelcomeSelect}
      />

      {/* 찜하기 (Pledge) Modal */}
      <PledgeModal
        isOpen={isPledgeModalOpen}
        onClose={() => {
          setIsPledgeModalOpen(false);
          setPledgeTargetItem(null);
        }}
        item={pledgeTargetItem}
        currentParticipant={currentParticipant}
        onSavePledge={handleSavePledge}
        onCancelPledge={handleCancelPledge}
      />

      {/* Add / Edit Modal */}
      <AddItemModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditItem(null);
        }}
        onSave={handleSaveItem}
        editItem={editItem}
      />

      {/* Participant Management Modal */}
      <ParticipantModal
        isOpen={isParticipantModalOpen}
        onClose={() => setIsParticipantModalOpen(false)}
        participants={partyData.participants}
        currentParticipant={currentParticipant}
        items={partyData.items}
        onSelectParticipant={handleSelectParticipant}
        onAddParticipant={handleAddParticipant}
      />

      {/* Status Report Modal */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        title={partyData.title}
        eventDate={partyData.eventDate}
        items={partyData.items}
        participants={partyData.participants}
      />

      {/* 휴지통 (삭제 항목 복구) Modal */}
      <TrashModal
        isOpen={isTrashModalOpen}
        onClose={() => setIsTrashModalOpen(false)}
        deletedItems={partyData.deletedItems || []}
        onRestoreItem={handleRestoreItem}
        onClearTrash={handleClearTrash}
      />

    </div>
  );
}
