import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Plus, X } from "lucide-react";

interface CardFormProps {
  listId: string;
}

export function CardForm({ listId }: CardFormProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState("");
  const queryClient = useQueryClient();

  const createCardMutation = useMutation({
    mutationFn: (title: string) => axios.post("/api/cards", { title, listId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lists"] });
      setIsEditing(false);
      setTitle("");
    },
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    createCardMutation.mutate(title);
  };

  if (isEditing) {
    return (
      <form onSubmit={onSubmit} className="mt-2 group">
        <textarea
          autoFocus
          className="w-full px-2 py-1.5 bg-zinc-900 border border-zinc-700 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-zinc-100 placeholder-zinc-500 mb-2"
          placeholder="Enter a title for this card..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSubmit(e as unknown as React.FormEvent);
            }
          }}
          rows={3}
        />
        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={createCardMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors"
          >
            Add Card
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
      className="w-full rounded-lg p-2 flex items-center gap-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors text-sm font-medium"
    >
      <Plus className="h-4 w-4" />
      Add a card
    </button>
  );
}
