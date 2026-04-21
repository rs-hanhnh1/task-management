import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { List } from "@/types";
import { CardItem } from "./CardItem";
import { CardForm } from "./CardForm";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { cn } from "@/lib/utils";
import { GripVertical } from "lucide-react";

interface ListItemProps {
  list: List;
  isOverlay?: boolean;
}

export function ListItem({ list, isOverlay }: ListItemProps) {
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

  const style = {
    transition,
    transform: CSS.Translate.toString(transform),
  };

  const cardIds = list.cards.map((c) => c.id);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "w-72 h-fit max-h-full flex flex-col bg-zinc-950 rounded-xl shrink-0 shadow-lg border border-zinc-800",
        isDragging && "opacity-50",
        isOverlay && "opacity-100 rotate-2 scale-105"
      )}
    >
      <div
        className="p-3 font-semibold flex items-center gap-2 cursor-grab text-zinc-100"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5 text-zinc-500" />
        {list.title}
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
