import { NextResponse } from 'next/server';
import { getPartyData, savePartyData, resetPartyData } from '@/lib/storage';
import { PartyItem, Participant, CustomSubItem } from '@/types/party';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const { data, storageType } = await getPartyData();
    return NextResponse.json(
      { success: true, data, storageType },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0' } }
    );
  } catch (error) {
    console.error('Failed to get party data:', error);
    return NextResponse.json(
      { success: false, message: '데이터를 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, payload } = body;
    const { data } = await getPartyData();

    let updatedData = { ...data };

    switch (action) {
      case 'save_all': {
        updatedData = payload;
        break;
      }

      case 'toggle_personal': {
        const { itemId, participantId } = payload;
        updatedData.items = updatedData.items.map((item) => {
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
            updatedAt: new Date().toISOString(),
          };
        });
        break;
      }

      case 'claim_shared_single': {
        const { itemId, participantId, participantName } = payload;
        updatedData.items = updatedData.items.map((item) => {
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
            updatedAt: new Date().toISOString(),
          };
        });
        break;
      }

      case 'toggle_shared_complete': {
        const { itemId } = payload;
        updatedData.items = updatedData.items.map((item) => {
          if (item.id !== itemId) return item;
          return {
            ...item,
            isCompleted: !item.isCompleted,
            updatedAt: new Date().toISOString(),
          };
        });
        break;
      }

      case 'add_sub_item': {
        const { itemId, name, names, participantId, participantName } = payload;
        const namesToAdd: string[] = [];
        if (Array.isArray(names)) {
          for (const n of names) {
            const trimmed = (n || '').trim();
            if (trimmed && !namesToAdd.includes(trimmed)) namesToAdd.push(trimmed);
          }
        }
        if (name && typeof name === 'string') {
          const split = name.split(/[,/]/).map((s) => s.trim()).filter(Boolean);
          for (const s of split) {
            if (!namesToAdd.includes(s)) namesToAdd.push(s);
          }
        }
        if (namesToAdd.length === 0) break;

        updatedData.items = updatedData.items.map((item) => {
          if (item.id !== itemId) return item;
          const currentSubs = item.subItems || [];
          const newSubs: CustomSubItem[] = [];

          for (const sName of namesToAdd) {
            const alreadyExists = currentSubs.some(
              (cs) => cs.participantId === participantId && cs.name.trim().toLowerCase() === sName.toLowerCase()
            );
            if (!alreadyExists) {
              newSubs.push({
                id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                name: sName,
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

          // If shared_single, ensure participant is in assignees
          let nextAssignees = item.assignees || (item.assigneeId ? [{ id: item.assigneeId, name: item.assigneeName || '' }] : []);
          if (item.type === 'shared_single') {
            if (!nextAssignees.some((a) => a.id === participantId)) {
              nextAssignees = [...nextAssignees, { id: participantId, name: participantName }];
            }
          }

          // If board game, also sync boardGames
          let nextGames = item.boardGames || [];
          if (item.name.includes('보드게임') || item.boardGames) {
            const gamesToAdd = newSubs.map((ns) => ({
              id: ns.id,
              gameName: ns.name,
              participantId,
              participantName,
              createdAt: ns.createdAt,
            }));
            nextGames = [...nextGames, ...gamesToAdd];
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
            updatedAt: new Date().toISOString(),
          };
        });
        break;
      }

      case 'remove_sub_item': {
        const { itemId, subItemId } = payload;
        updatedData.items = updatedData.items.map((item) => {
          if (item.id !== itemId) return item;
          const prevSubs = item.subItems || [];
          const nextSubs = prevSubs.filter((s) => s.id !== subItemId);
          const deletedSub = prevSubs.find((s) => s.id === subItemId);

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

          const nextGames = (item.boardGames || []).filter((g) => g.id !== subItemId);

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
            updatedAt: new Date().toISOString(),
          };
        });
        break;
      }

      case 'add_board_game': {
        const { itemId, gameName, participantId, participantName } = payload;
        updatedData.items = updatedData.items.map((item) => {
          if (item.id !== itemId) return item;
          const currentGames = item.boardGames || [];
          const newGame = {
            id: `bg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            gameName: (gameName || '').trim(),
            participantId,
            participantName,
            createdAt: new Date().toISOString(),
          };
          const nextGames = [...currentGames, newGame];

          const currentSubs = item.subItems || [];
          const newSub: CustomSubItem = {
            id: newGame.id,
            name: newGame.gameName,
            participantId,
            participantName,
            createdAt: newGame.createdAt,
          };
          const nextSubs = [...currentSubs, newSub];

          const currentAssignees = item.assignees || (item.assigneeId ? [{ id: item.assigneeId, name: item.assigneeName || '' }] : []);
          const hasAssignee = currentAssignees.some((a) => a.id === participantId);
          const nextAssignees = hasAssignee
            ? currentAssignees
            : [...currentAssignees, { id: participantId, name: participantName }];

          return {
            ...item,
            boardGames: nextGames,
            subItems: nextSubs,
            assignees: nextAssignees,
            assigneeId: nextAssignees[0]?.id,
            assigneeName: nextAssignees[0]?.name,
            isCompleted: true,
            updatedAt: new Date().toISOString(),
          };
        });
        break;
      }

      case 'remove_board_game': {
        const { itemId, gameId } = payload;
        updatedData.items = updatedData.items.map((item) => {
          if (item.id !== itemId) return item;
          const currentGames = item.boardGames || [];
          const nextGames = currentGames.filter((g) => g.id !== gameId);
          const nextSubs = (item.subItems || []).filter((s) => s.id !== gameId);

          const remainingParticipantIds = new Set(nextGames.map((g) => g.participantId));
          const currentAssignees = item.assignees || [];
          const nextAssignees = currentAssignees.filter((a) => remainingParticipantIds.has(a.id));

          return {
            ...item,
            boardGames: nextGames,
            subItems: nextSubs,
            assignees: nextAssignees,
            assigneeId: nextAssignees[0]?.id,
            assigneeName: nextAssignees[0]?.name,
            isCompleted: nextGames.length > 0,
            updatedAt: new Date().toISOString(),
          };
        });
        break;
      }

      case 'update_quantity_contribution': {
        const { itemId, participantId, participantName, quantity, note, subItemNames } = payload;
        updatedData.items = updatedData.items.map((item) => {
          if (item.id !== itemId) return item;
          const currentContribs = item.contributions || [];
          const existingIndex = currentContribs.findIndex((c) => c.participantId === participantId);

          let newContribs = [...currentContribs];
          if (quantity <= 0) {
            // Remove contribution, subItems, and completed status for this participant
            newContribs = newContribs.filter((c) => c.participantId !== participantId);
            const newCompletedBy = (item.completedBy || []).filter((id) => id !== participantId);
            const nextSubs = (item.subItems || []).filter((s) => s.participantId !== participantId);
            return {
              ...item,
              contributions: newContribs,
              completedBy: newCompletedBy,
              subItems: nextSubs,
              updatedAt: new Date().toISOString(),
            };
          } else if (existingIndex >= 0) {
            // Update contribution
            newContribs[existingIndex] = {
              participantId,
              participantName,
              quantity,
              note: note ?? newContribs[existingIndex].note,
            };
          } else {
            // Add new contribution
            newContribs.push({
              participantId,
              participantName,
              quantity,
              note,
            });
          }

          // If subItemNames was passed (from multi-variety selection)
          let nextSubs = item.subItems || [];
          if (Array.isArray(subItemNames)) {
            const otherSubs = nextSubs.filter((s) => s.participantId !== participantId);
            const myNewSubs: CustomSubItem[] = subItemNames
              .map((n: string) => (n || '').trim())
              .filter(Boolean)
              .map((n: string, idx: number) => ({
                id: `sub-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
                name: n,
                participantId,
                participantName,
                createdAt: new Date().toISOString(),
              }));
            nextSubs = [...otherSubs, ...myNewSubs];
          }

          return {
            ...item,
            contributions: newContribs,
            subItems: nextSubs,
            updatedAt: new Date().toISOString(),
          };
        });
        break;
      }

      case 'cancel_pledge': {
        const { itemId, participantId } = payload;
        updatedData.items = updatedData.items.map((item) => {
          if (item.id !== itemId) return item;
          const nextAssignees = (item.assignees || []).filter((a) => a.id !== participantId);
          const nextGames = (item.boardGames || []).filter((g) => g.participantId !== participantId);
          const nextSubs = (item.subItems || []).filter((s) => s.participantId !== participantId);
          const nextContribs = (item.contributions || []).filter((c) => c.participantId !== participantId);
          const nextCompleted = (item.completedBy || []).filter((id) => id !== participantId);

          return {
            ...item,
            assignees: nextAssignees,
            assigneeId: nextAssignees[0]?.id,
            assigneeName: nextAssignees[0]?.name,
            boardGames: nextGames,
            subItems: nextSubs,
            contributions: nextContribs,
            completedBy: nextCompleted,
            isCompleted: item.type === 'shared_single' ? (nextAssignees.length > 0 || nextGames.length > 0 || nextSubs.length > 0) : nextCompleted.length > 0,
            updatedAt: new Date().toISOString(),
          };
        });
        break;
      }

      case 'add_item': {
        const newItem: PartyItem = {
          ...payload,
          id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          updatedAt: new Date().toISOString(),
        };
        updatedData.items = [newItem, ...updatedData.items];
        break;
      }

      case 'edit_item': {
        const { id, updates } = payload;
        updatedData.items = updatedData.items.map((item) => {
          if (item.id !== id) return item;
          return {
            ...item,
            ...updates,
            updatedAt: new Date().toISOString(),
          };
        });
        break;
      }

      case 'delete_item': {
        const { itemId } = payload;
        const itemToDelete = updatedData.items.find((item) => item.id === itemId);
        if (itemToDelete) {
          updatedData.items = updatedData.items.filter((item) => item.id !== itemId);
          const currentDeleted = updatedData.deletedItems || [];
          updatedData.deletedItems = [
            { ...itemToDelete, updatedAt: new Date().toISOString() },
            ...currentDeleted,
          ];
        }
        break;
      }

      case 'restore_item': {
        const { itemId } = payload;
        const currentDeleted = updatedData.deletedItems || [];
        const itemToRestore = currentDeleted.find((item) => item.id === itemId);
        if (itemToRestore) {
          updatedData.deletedItems = currentDeleted.filter((item) => item.id !== itemId);
          updatedData.items = [
            { ...itemToRestore, updatedAt: new Date().toISOString() },
            ...updatedData.items,
          ];
        }
        break;
      }

      case 'clear_trash': {
        updatedData.deletedItems = [];
        break;
      }

      case 'add_participant': {
        const newParticipant: Participant = {
          ...payload,
          id: `p-${Date.now()}`,
        };
        updatedData.participants = [...updatedData.participants, newParticipant];
        break;
      }

      case 'update_participant': {
        const { id, updates } = payload;
        updatedData.participants = updatedData.participants.map((p) => {
          if (p.id !== id) return p;
          return { ...p, ...updates };
        });
        // Also update names in assignees, boardGames, or contributions
        if (updates.name) {
          updatedData.items = updatedData.items.map((item) => {
            let itemUpdated = false;
            let assigneeName = item.assigneeName;
            if (item.assigneeId === id) {
              assigneeName = updates.name;
              itemUpdated = true;
            }
            const assignees = item.assignees?.map((a) => {
              if (a.id === id) {
                itemUpdated = true;
                return { ...a, name: updates.name };
              }
              return a;
            });
            const boardGames = item.boardGames?.map((bg) => {
              if (bg.participantId === id) {
                itemUpdated = true;
                return { ...bg, participantName: updates.name };
              }
              return bg;
            });
            const contributions = item.contributions?.map((c) => {
              if (c.participantId === id) {
                itemUpdated = true;
                return { ...c, participantName: updates.name };
              }
              return c;
            });
            if (itemUpdated) {
              return { ...item, assigneeName, assignees, boardGames, contributions };
            }
            return item;
          });
        }
        break;
      }

      case 'reset': {
        const resetData = await resetPartyData();
        return NextResponse.json({ success: true, data: resetData });
      }

      default:
        return NextResponse.json(
          { success: false, message: '알 수 없는 액션입니다.' },
          { status: 400 }
        );
    }

    const { storageType } = await savePartyData(updatedData);
    return NextResponse.json({ success: true, data: updatedData, storageType });
  } catch (error) {
    console.error('Failed to update party data:', error);
    return NextResponse.json(
      { success: false, message: '데이터 저장 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
