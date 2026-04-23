# Project Overview
**Name**: Task Management MVP
**Purpose**: A simplified, single-board Kanban application (Trello-like) focused on a seamless drag-and-drop experience for lists and cards, alongside core CRUD operations.

## Key Features
- Single board workspace.
- Horizontal list arrangement.
- Vertical card arrangement within lists.
- Drag-and-drop functionality for reordering lists and cards (including moving cards between lists).
- Card details modal for viewing and editing descriptions.
- Tag system for cards.

## Core Models (Prisma)
- **List**: Represents a column. Has a `title`, `order`, and a relation to `Card`s.
- **Card**: Represents a task. Has a `title`, `description`, `order`, `tags`, and belongs to a `List`.

## Implementation Details
- Uses Next.js App Router for routing and API endpoints.
- Uses TanStack Query for data fetching, caching, and optimistic UI updates during drag-and-drop.
- Uses `@dnd-kit` for complex drag-and-drop interactions.