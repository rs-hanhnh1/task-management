import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Plus, X } from "lucide-react";

export function ListForm() {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState("");
  const queryClient = useQueryClient();

  const createListMutation = useMutation({
    mutationFn: (title: string) => axios.post("/api/lists", { title }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lists"] });
      setIsEditing(false);
      setTitle("");
    },
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    createListMutation.mutate(title);
  };

  if (isEditing) {
    return (
      <form
        onSubmit={onSubmit}
        className="w-72 shrink-0 bg-white dark:bg-zinc-950 rounded-xl p-3 shadow-md border border-zinc-200 dark:border-zinc-800 transition-colors"
      >
        <input
          autoFocus
          className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 mb-3 transition-shadow"
          placeholder="Enter list title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={createListMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
          >
            Add List
          </button>
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-300 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="shrink-0 w-72">
      <button
        onClick={() => setIsEditing(true)}
        className="w-full h-fit bg-zinc-200/50 dark:bg-zinc-900/50 hover:bg-zinc-200 dark:hover:bg-zinc-800/80 rounded-xl px-4 py-3 flex items-center gap-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-300 font-medium transition-colors border border-dashed border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600"
      >
        <Plus className="h-5 w-5" />
        Add another list
      </button>
    </div>
  );
}
