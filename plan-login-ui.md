# Plan: Login Page UI Implementation

## Objective
Create a premium, modern, and responsive Login Page UI at the `/login` route. The design will focus on a "glassmorphic zinc" aesthetic to match the existing Kanban board, ensuring a seamless and high-end user experience. This is a **UI-only** task; no authentication logic will be implemented in this phase.

## Affected files
| File | Change | Reason |
|------|--------|--------|
| `app/login/page.tsx` | Create | Main entry point for the `/login` route. |
| `components/login/LoginForm.tsx` | Create | Core login form component with validation UI. |
| `components/login/LoginHeader.tsx` | Create | Branding and welcome section for the login card. |
| `components/login/SocialLogin.tsx` | Create | Mock UI for third-party authentication providers. |

## Implementation steps
1. **Route Setup**: Ensure `app/login/` exists and create a basic `page.tsx` that uses the project's background styles (`bg-zinc-50 dark:bg-zinc-900`).
2. **Layout Design**: Implement a centered layout using Flexbox/Grid to house the login card.
3. **Login Card (Glassmorphism)**:
    - Background: `bg-white/80 dark:bg-zinc-900/80`
    - Blur: `backdrop-blur-xl`
    - Border: `border border-zinc-200/50 dark:border-zinc-800/50`
    - Shadow: `shadow-2xl shadow-zinc-200/50 dark:shadow-black/50`
4. **Form Components**:
    - Use `react-hook-form` and `zod` for the form structure (UI validation only).
    - Create custom-styled inputs matching the Kanban board's aesthetic.
    - Add a "premium" primary button with hover transitions and subtle scale effects.
5. **Branding & Social**:
    - Add a clean header with the application name/logo.
    - Add "Continue with Google/GitHub" buttons with consistent styling.
6. **Responsive Polish**: Ensure the card scales correctly on mobile and looks sharp on all screens.
7. **Accessibility**: Add proper labels, ARIA attributes, and keyboard navigation support.

## Interface changes
- **New Route**: `/login` (Non-breaking)

## Test strategy
- **Manual Visual Review**: Verify dark mode consistency, blur effects, and responsive layout across different breakpoints.
- **Form UI Test**: Ensure validation messages appear correctly when fields are empty/invalid.
- **Accessibility Check**: Verify focus states for inputs and buttons.

## Risks & edge cases
- **Tailwind 4 Compatibility**: Ensure all classes follow Tailwind 4 conventions (e.g., using `@theme` tokens if defined).
- **Blur Performance**: Heavy backdrop filters can sometimes impact performance on low-end mobile devices; keep the blur amount balanced.
- **Next.js 16 Patterns**: Ensure Server/Client component separation is strictly followed (`'use client'` for the form).

## Out of scope
- Integration with NextAuth.js or any backend authentication providers.
- Real form submission logic or redirect handling.
- Password reset or registration pages (unless requested later).
