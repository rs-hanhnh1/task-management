import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Card } from "@/types";
import { X, Trash2 } from "lucide-react";

interface CardModalProps {
  isOpen: boolean;
  onClose: () => void;
  card: Card;
}

export function CardModal({ isOpen, onClose, card }: CardModalProps) {
  const [description, setDescription] = useState(card.description || "");
  const queryClient = useQueryClient();

  const updateCardMutation = useMutation({
    mutationFn: () =>
      axios.patch(`/api/cards/${card.id}`, { description }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lists"] });
    },
  });

  const deleteCardMutation = useMutation({
    mutationFn: () => axios.delete(`/api/cards/${card.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lists"] });
      onClose();
    },
  });

  const onSave = () => {
    updateCardMutation.mutate();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-zinc-900 w-full max-w-lg rounded-xl shadow-2xl overflow-hidden border border-zinc-800">
        <div className="flex justify-between items-center p-4 border-b border-zinc-800 bg-zinc-950">
          <h2 className="text-lg font-semibold text-zinc-100">{card.title}</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200 transition-colors p-1 rounded-md hover:bg-zinc-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6">
          <div className="mb-6">
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Description
            </label>
            <textarea
              className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px] text-zinc-200 placeholder-zinc-600 resize-y"
              placeholder="Add a more detailed description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="flex justify-between items-center mt-8">
            <button
              onClick={onSave}
              disabled={updateCardMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Save Changes
            </button>
            <button
              onClick={() => deleteCardMutation.mutate()}
              disabled={deleteCardMutation.isPending}
              className="flex items-center gap-2 text-red-500 hover:text-red-400 hover:bg-red-500/10 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              Delete Card
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
