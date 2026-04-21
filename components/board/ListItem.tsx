import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { List } from "@/types";
import { CardItem } from "./CardItem";
import { CardForm } from "./CardForm";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { cn } from "@/lib/utils";
import { GripVertical } from "lucide-react";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

interface ListItemProps {
  list: List;
  isOverlay?: boolean;
}

export function ListItem({ list, isOverlay }: ListItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(list.title);
  const queryClient = useQueryClient();

  const updateListMutation = useMutation({
    mutationFn: (newTitle: string) => axios.patch(`/api/lists/${list.id}`, { title: newTitle }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lists"] });
      setIsEditing(false);
    },
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() && title !== list.title) {
      updateListMutation.mutate(title);
    } else {
      setIsEditing(false);
    }
  };

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: list.id,
    data: {
      type: "List",
      list,
    },
  });

  const hash = list.id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const hue = hash % 360;

  const style = {
    transition,
    transform: CSS.Translate.toString(transform),
    backgroundColor: `hsl(${hue}, 60%, var(--list-lightness))`,
    borderColor: `hsl(${hue}, 60%, var(--list-border-lightness))`,
  };

  const cardIds = list.cards.map((c) => c.id);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "w-72 h-fit max-h-full flex flex-col rounded-xl shrink-0 shadow-lg border",
        isDragging && "opacity-50",
        isOverlay && "opacity-100 rotate-2 scale-105"
      )}
    >
      <div
        className="p-3 font-semibold flex items-center gap-2 text-zinc-900 group"
      >
        <div {...attributes} {...listeners} className="cursor-grab">
          <GripVertical className="h-5 w-5 text-zinc-500" />
        </div>
        {isEditing ? (
          <form onSubmit={onSubmit} className="flex-1">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => setIsEditing(false)}
              autoFocus
              className="w-full bg-white px-2 py-1 rounded text-sm border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900"
            />
          </form>
        ) : (
          <div 
            onClick={() => setIsEditing(true)}
            className="flex-1 cursor-text truncate hover:bg-black/5 px-2 py-1 rounded transition-colors"
          >
            {list.title}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-2 custom-scrollbar">
        <div className="flex flex-col gap-2 min-h-[2px]">
          <SortableContext
            items={cardIds}
            strategy={verticalListSortingStrategy}
          >
            {list.cards.map((card) => (
              <CardItem key={card.id} card={card} />
            ))}
          </SortableContext>
        </div>
        <div className="mt-2">
          <CardForm listId={list.id} />
        </div>
      </div>
    </div>
  );
}
