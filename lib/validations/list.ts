import { z } from "zod";

export const CreateListSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
});

export const UpdateListSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
});

export const ReorderListSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      order: z.number(),
    })
  ),
});
