// types/types.d.ts

export interface ChatRoom {
  id: string;
  live: boolean;
}

export interface Customer {
  chatRoom: ChatRoom[];
}

export interface Domain {
  customer: Customer[];
  id: string;
  name: string;
}

export type Domains = Domain[] | null;
