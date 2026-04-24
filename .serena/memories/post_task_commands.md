# Post-Task Commands
When a task is completed, especially if it involves modifying components, styles, or logic, run the following to ensure code quality:
1. `npm run lint`: Run ESLint to check for issues and automatically fix them if possible.
2. If modifying the Prisma schema (`prisma/schema.prisma`):
   - Run `npx prisma generate` to update the Prisma Client.
   - Run `npx prisma db push` to sync the database schema.
3. Use `git status` and `git diff` to review your changes before committing.