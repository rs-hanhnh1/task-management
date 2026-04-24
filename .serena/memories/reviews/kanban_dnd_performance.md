# Review Record: Kanban Drag-and-Drop Functionality

## Metadata
- **Date**: 2026-04-24
- **Agent**: Reviewer
- **Skills Used**: `ts-pr-review`, `ts-code-understanding`
- **Target**: `components/board/ListContainer.tsx`, `app/api/cards/reorder/route.ts`, `app/api/lists/reorder/route.ts`

## Summary of Findings
- **Status**: Request Changes
- **Key Issues**:
    1. **Performance**: Root state overload in `ListContainer` causes full-board re-renders during drag operations.
    2. **State Sync**: Dependency on `listsRef.current` in mutations poses a risk for race conditions.
    3. **Security**: Lack of ownership checks in reorder APIs.

## Recommendations
- Memoize `ListItem` and `CardItem` components.
- Move DnD logic to a specialized store (e.g., Zustand) or custom hook to isolate re-renders.
- Implement server-side ownership validation in Prisma transactions.
- Optimize payload size by only sending changed items.
