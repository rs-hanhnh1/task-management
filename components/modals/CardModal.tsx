import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { List, Card } from "@/types";
import { X, Trash2, Tag as TagIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface CardModalProps {
  isOpen: boolean;
  onClose: () => void;
  card: Card;
}

const TAG_COLORS = [
  { name: "Red", value: "bg-red-500" },
  { name: "Orange", value: "bg-orange-500" },
  { name: "Amber", value: "bg-amber-500" },
  { name: "Green", value: "bg-green-500" },
  { name: "Blue", value: "bg-blue-500" },
  { name: "Purple", value: "bg-purple-500" },
  { name: "Pink", value: "bg-pink-500" },
];

export function CardModal({ isOpen, onClose, card }: CardModalProps) {
  const [description, setDescription] = useState(card.description || "");
  const [selectedTags, setSelectedTags] = useState<{name: string, color: string}[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [tagColor, setTagColor] = useState(TAG_COLORS[0].value);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (isOpen) {
      setDescription(card.description || "");
      try {
        setSelectedTags(JSON.parse(card.tags || "[]"));
      } catch (e) {
        setSelectedTags([]);
      }
    }
  }, [isOpen, card]);

  const updateCardMutation = useMutation({
    mutationFn: () =>
      axios.patch(`/api/cards/${card.id}`, { 
        description,
        tags: JSON.stringify(selectedTags)
      }),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["lists"] });
      const previousLists = queryClient.getQueryData<List[]>(["lists"]);

      if (previousLists) {
        const newLists = previousLists.map((list) => ({
          ...list,
          cards: list.cards.map((c: Card) =>
            c.id === card.id
              ? { ...c, description, tags: JSON.stringify(selectedTags) }
              : c
          ),
        }));
        queryClient.setQueryData(["lists"], newLists);
      }

      return { previousLists };
    },
    onError: (err, variables, context) => {
      if (context?.previousLists) {
        queryClient.setQueryData(["lists"], context.previousLists);
      }
    },
    onSettled: () => {
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

  const addTag = () => {
    if (!tagInput.trim()) return;
    setSelectedTags([...selectedTags, { name: tagInput.trim(), color: tagColor }]);
    setTagInput("");
  };

  const removeTag = (index: number) => {
    setSelectedTags(selectedTags.filter((_, i) => i !== index));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4 transition-all">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-xl shadow-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 transition-colors max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 transition-colors shrink-0">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 truncate pr-2">{card.title}</h2>
          <button
            onClick={onClose}
            className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors p-1.5 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-800 shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-5 space-y-6 overflow-y-auto custom-scrollbar flex-1">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Description
            </label>
            <textarea
              className="w-full p-3 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 min-h-[120px] text-zinc-900 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-600 resize-y transition-shadow"
              placeholder="Add a more detailed description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          
          <div className="bg-zinc-50 dark:bg-zinc-950/50 p-3 rounded-lg border border-zinc-100 dark:border-zinc-800/50">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Tags
            </label>
            <div className="flex flex-col gap-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  className="flex-1 px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-zinc-900 dark:text-zinc-100 transition-shadow min-w-0"
                  placeholder="e.g. Bug, Feature..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-4 shrink-0 rounded-lg text-sm font-medium border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors shadow-sm"
                >
                  Add
                </button>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Color:</span>
                <div className="flex items-center gap-1.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 px-2 py-1 rounded-lg">
                  {TAG_COLORS.map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => setTagColor(c.value)}
                      className={cn(
                        "w-5 h-5 rounded-full transition-transform hover:scale-110 shrink-0",
                        c.value,
                        tagColor === c.value ? "ring-2 ring-offset-2 ring-blue-500 dark:ring-offset-zinc-900 scale-110 shadow-sm" : "opacity-80"
                      )}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>
            </div>
            
            {selectedTags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                {selectedTags.map((tag, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-white shadow-sm",
                      tag.color
                    )}
                  >
                    <TagIcon className="w-3.5 h-3.5 opacity-80" />
                    {tag.name}
                    <button
                      type="button"
                      onClick={() => removeTag(index)}
                      className="hover:bg-black/20 rounded-full p-0.5 ml-0.5 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-between items-center pt-4 mt-auto border-t border-zinc-200 dark:border-zinc-800">
            <button
              onClick={onSave}
              disabled={updateCardMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
            >
              Save Changes
            </button>
            <button
              onClick={() => deleteCardMutation.mutate()}
              disabled={deleteCardMutation.isPending}
              className="flex items-center gap-2 text-red-600 dark:text-red-500 hover:text-red-700 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
