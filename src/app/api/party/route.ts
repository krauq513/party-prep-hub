import { NextResponse } from 'next/server';
import { getPartyData, savePartyData, resetPartyData } from '@/lib/storage';
import { PartyItem, Participant } from '@/types/party';

export async function GET() {
  try {
    const { data, storageType } = await getPartyData();
    return NextResponse.json({ success: true, data, storageType });
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

          return {
            ...item,
            assignees: newAssignees,
            assigneeId: newAssignees.length > 0 ? newAssignees[0].id : undefined,
            assigneeName: newAssignees.length > 0 ? newAssignees[0].name : undefined,
            isCompleted: newAssignees.length > 0 ? item.isCompleted : false,
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

      case 'update_quantity_contribution': {
        const { itemId, participantId, participantName, quantity, note } = payload;
        updatedData.items = updatedData.items.map((item) => {
          if (item.id !== itemId) return item;
          const currentContribs = item.contributions || [];
          const existingIndex = currentContribs.findIndex((c) => c.participantId === participantId);

          let newContribs = [...currentContribs];
          if (quantity <= 0) {
            // Remove contribution
            newContribs = newContribs.filter((c) => c.participantId !== participantId);
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

          return {
            ...item,
            contributions: newContribs,
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
        // Also update names in assignees or contributions
        if (updates.name) {
          updatedData.items = updatedData.items.map((item) => {
            let itemUpdated = false;
            let assigneeName = item.assigneeName;
            if (item.assigneeId === id) {
              assigneeName = updates.name;
              itemUpdated = true;
            }
            const contributions = item.contributions?.map((c) => {
              if (c.participantId === id) {
                itemUpdated = true;
                return { ...c, participantName: updates.name };
              }
              return c;
            });
            if (itemUpdated) {
              return { ...item, assigneeName, contributions };
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
