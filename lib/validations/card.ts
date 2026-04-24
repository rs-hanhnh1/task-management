import { z } from "zod";

export const CreateCardSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  listId: z.string(),
  description: z.string().optional().nullable(),
  tags: z.string().optional(),
});

export const UpdateCardSchema = z.object({
  title: z.string().min(1, "Title is required").max(255).optional(),
  description: z.string().optional().nullable(),
  tags: z.string().optional(),
});

export const ReorderCardSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      order: z.number(),
      listId: z.string(),
    })
  ),
});
