# Conventions and Styles
## Tech Stack
- Framework: Next.js 16 (App Router)
- Database/ORM: Prisma
- State Management/Data Fetching: TanStack Query (@tanstack/react-query)
- UI/Styling: Tailwind CSS (with `clsx` and `tailwind-merge`)
- Validation: Zod
- Drag and Drop: @dnd-kit (core, sortable, utilities)
- Language: TypeScript

## Code Organization
- `app/`: Next.js App Router files (`page.tsx`, `layout.tsx`)
- `app/api/`: API Routes for Lists and Cards
- `components/`: UI Components grouped by domain (e.g., `board/`, `modals/`, `ui/`)
- `lib/`: Utilities, Prisma client (`db.ts`), and Zod schemas (`validations/`)
- `prisma/`: Prisma schema and database configuration

## Coding Guidelines
- **TypeScript**: Use strict typing for all components and API handlers.
- **Server/Client Components**: Use "use client" directives explicitly for components needing state or browser APIs (like Drag and Drop).
- **Styling**: Use Tailwind CSS utility classes. Combine conditional classes using `cn` utility (clsx + tailwind-merge).
- **Form Validation**: Use `react-hook-form` integrated with `zod` resolvers.
- **Data Mutation**: Use TanStack Query with optimistic updates for smooth UI experiences, especially critical for Drag and Drop operations.