export type Card = {
  id: string;
  title: string;
  description: string | null;
  tags: string;
  order: number;
  listId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type List = {
  id: string;
  title: string;
  order: number;
  cards: Card[];
  createdAt: Date;
  updatedAt: Date;
};
