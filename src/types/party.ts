export type ItemType = 'personal' | 'shared_single' | 'shared_quantity';

export interface Participant {
  id: string;
  name: string;
  avatar: string; // emoji
  color: string;  // hex or tailwind color class
  isLeader?: boolean;
}

export interface QuantityContribution {
  participantId: string;
  participantName: string;
  quantity: number;
  note?: string;
}

export interface SingleAssignee {
  id: string;
  name: string;
  note?: string;
}

export interface BoardGameItem {
  id: string;
  gameName: string;
  participantId: string;
  participantName: string;
  createdAt: string;
}

export interface CustomSubItem {
  id: string;
  name: string;
  participantId: string;
  participantName: string;
  createdAt: string;
}

export interface PartyItem {
  id: string;
  name: string;
  category: string;
  type: ItemType;
  
  // For 'personal' items: list of participant IDs who packed this item for themselves
  completedBy?: string[];
  
  // For 'shared_single' items: supports multiple people claiming/찜
  assignees?: SingleAssignee[];
  assigneeId?: string; // for backwards compatibility
  assigneeName?: string;
  isCompleted?: boolean;

  // For board games: list of games brought by participants
  boardGames?: BoardGameItem[];

  // For items with custom sub-items (e.g. 라면, 과자, 마른안주, etc.)
  subItems?: CustomSubItem[];
  
  // For 'shared_quantity' items:
  targetQuantity?: number;
  unit?: string;
  contributions?: QuantityContribution[];
  
  notes?: string;
  updatedAt: string;
}

export interface PartyData {
  title: string;
  eventDate?: string;
  location?: string;
  naverMapUrl?: string;
  kakaoMapUrl?: string;
  participants: Participant[];
  items: PartyItem[];
  deletedItems?: PartyItem[];
  updatedAt: string;
}

export type FilterCategory = '전체' | '개인필수' | '식기' | '고기/메인' | '채소/곁들임' | '양념/소스' | '주류/음료' | '식사/안주' | '오락/비상용품';
export type FilterType = 'all' | 'personal' | 'shared_single' | 'shared_quantity';
export type FilterStatus = 'all' | 'incomplete' | 'my_items';
