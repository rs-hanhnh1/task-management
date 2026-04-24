# Plan: About Kanban Board Page

## Objective
Create a dedicated "/about" page to educate new users on Kanban methodology and how to use the specific features of this task management application. The page will maintain the project's premium glassmorphic aesthetic.

## Affected files
| File | Change | Reason |
|------|--------|--------|
| app/about/page.tsx | Create | New route for the About page. |
| components/about/AboutHeader.tsx | Create | Reusable header with navigation back to the board. |
| components/about/AboutContent.tsx | Create | Main content sections (What is Kanban, Guides, Features). |

## Implementation steps
1. **Create Page Structure**: Initialize `app/about/page.tsx` with the basic layout and background decorative elements consistent with the login page.
2. **Implement Header**: Create `components/about/AboutHeader.tsx` featuring the title and a "Back to Board" button.
3. **Draft Content Sections**:
    - **What is Kanban**: Explain the Japanese concept of "visual signal" and how it helps visualize work.
    - **How to Use**: Step-by-step on dragging lists/cards and creating new ones.
    - **Key Features**: Highlight DnD, Theme Toggle, and Real-time sync (React Query).
4. **Style with Glassmorphism**: Apply `backdrop-blur`, `bg-white/70`, and `dark:bg-zinc-950/70` to match the existing theme.
5. **Add Responsive Design**: Ensure readability on both desktop and mobile.

## Interface changes
- New public route: `/about`.

## Test strategy
- **Manual**: Verify navigation from the main page (if linked) and ensure all sections are readable in both Light and Dark modes.

## Risks & edge cases
- **Design Consistency**: Must ensure the padding and typography match the main Board and Login pages.
- **Performance**: High-blur background elements should be optimized to avoid lag on low-end devices.

## Out of scope
- Interactive tutorials or interactive demo boards within the about page.
