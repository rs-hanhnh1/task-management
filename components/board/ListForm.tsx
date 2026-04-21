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
        className="w-72 shrink-0 bg-zinc-950 rounded-xl p-3 shadow-sm border border-zinc-800"
      >
        <input
          autoFocus
          className="w-full px-2 py-1 bg-zinc-900 border-zinc-700 text-sm rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-100 placeholder-zinc-500 mb-2"
          placeholder="Enter list title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={createListMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors"
          >
            Add List
          </button>
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="p-1.5 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-300 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </form>
    );
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      className="w-72 shrink-0 bg-zinc-900/50 hover:bg-zinc-800/80 rounded-xl p-3 flex items-center gap-2 text-zinc-400 hover:text-zinc-300 font-medium transition-colors border border-dashed border-zinc-700 hover:border-zinc-600"
    >
      <Plus className="h-5 w-5" />
      Add another list
    </button>
  );
}
