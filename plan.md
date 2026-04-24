# Plan: Single-Board Kanban MVP

## Objective
Build a simplified, single-board Trello-like MVP application using Next.js 16 (App Router), Prisma, and TanStack Query. The focus is entirely on a seamless drag-and-drop experience for lists and cards, alongside core CRUD operations, without the complexity of managing multiple boards.

## Schema (Prisma)
```prisma
model List {
  id        String   @id @default(uuid())
  title     String
  order     Int
  cards     Card[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Card {
  id          String   @id @default(uuid())
  title       String
  description String?
  order       Int
  listId      String
  list        List     @relation(fields: [listId], references: [id], onDelete: Cascade)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([listId])
}
```

## Folder Structure
```text
app/
  page.tsx                       # Main Kanban board
  api/
    lists/route.ts               # Create list / Get all lists (with cards)
    lists/reorder/route.ts       # Bulk update list order
    cards/route.ts               # Create card
    cards/reorder/route.ts       # Bulk update card order (across lists or same list)
    cards/[cardId]/route.ts      # Update / Delete card
components/
  board/
    ListContainer.tsx            # Renders lists and handles DnD context
    ListItem.tsx                 # Individual list column
    ListForm.tsx                 # Form to add a new list
    CardItem.tsx                 # Individual draggable card
    CardForm.tsx                 # Form to add a new card
  modals/
    CardModal.tsx                # Modal for viewing/editing card details
  ui/                            # Reusable UI components (buttons, inputs)
lib/
  db.ts                          # Prisma client
  utils.ts                       # Tailwind merge / clsx utilities
  validations/
    list.ts                      # Zod schemas for lists
    card.ts                      # Zod schemas for cards
```

## Pages
1. **Home (`/`)**: The core workspace. Displays lists horizontally, cards vertically within lists. Implements full drag-and-drop.

## API Routes
- **Lists**:
  - `GET /api/lists`: Get all lists and their associated cards, ordered by `order`.
  - `POST /api/lists`: Create a list (receives `title`). Assigns `order` automatically.
  - `PUT /api/lists/reorder`: Update orders when a list is dragged.
- **Cards**:
  - `POST /api/cards`: Create a card (receives `title`, `listId`).
  - `PUT /api/cards/reorder`: Update orders and `listId` when a card is dragged.
  - `PATCH /api/cards/[cardId]`: Update card description/title.
  - `DELETE /api/cards/[cardId]`: Delete a card.

## Components Breakdown
- `ListContainer`: Wraps the lists in a DragDropContext. Manages the optimistic state for both lists and cards during drag events.
- `ListItem`: Represents a column. It is a Droppable for cards, and a Draggable itself.
- `CardItem`: Represents a task. It is Draggable.
- `CardModal`: Opens when clicking a card to edit its description or delete it.

## Implementation Steps
1. **Database Setup**: Initialize Prisma and push the List and Card schema.
2. **Install Libraries**: Install `@hello-pangea/dnd` for drag-and-drop, `zod` for validation, and TanStack Query for client-side state.
3. **Core API Routes**: Build standard CRUD for Lists and Cards, focusing on getting everything needed for the single board in one query (`GET /api/lists`).
4. **Data Fetching Setup**: Set up TanStack Query in `app/page.tsx` to fetch the initial data.
5. **Kanban UI**: Build `ListContainer`, `ListItem`, and `CardItem` without DnD first. Ensure horizontal scrolling works.
6. **Drag and Drop (Lists)**: Implement horizontal drag-and-drop for lists. Add optimistic updates to TanStack Query and call `PUT /api/lists/reorder`.
7. **Drag and Drop (Cards)**: Implement vertical drag-and-drop for cards, including moving cards between different lists. Add optimistic updates and call `PUT /api/cards/reorder`.
8. **Card Details**: Add `CardModal` for editing descriptions and deleting cards.

## Risks & Edge Cases
- **Drag-and-Drop Order Calculation**: Calculating the new `order` index carefully is crucial when items are dragged. Re-ordering usually requires updating multiple rows in the database.
- **Optimistic Updates Sync**: If a `reorder` API call fails, the client state must revert perfectly to avoid UI desync.
- **Strict Mode React**: `@hello-pangea/dnd` requires careful setup with React 18/19 Strict Mode (sometimes requiring a small `useEffect` to defer rendering).
