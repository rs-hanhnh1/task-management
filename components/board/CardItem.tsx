import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card } from "@/types";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { CardModal } from "../modals/CardModal";

interface CardItemProps {
  card: Card;
  isOverlay?: boolean;
}

export function CardItem({ card, isOverlay }: CardItemProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: card.id,
    data: {
      type: "Card",
      card,
    },
  });

  const style = {
    transition,
    transform: CSS.Translate.toString(transform),
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        onClick={() => setIsModalOpen(true)}
        className={cn(
          "bg-white hover:bg-zinc-50 hover:ring-1 hover:ring-zinc-300 transition-colors cursor-pointer text-sm p-3 rounded-lg shadow-sm border border-zinc-200 group text-zinc-900",
          isDragging && "opacity-50",
          isOverlay && "opacity-100 rotate-3 scale-105 shadow-xl ring-2 ring-blue-500"
        )}
      >
        <div className="font-medium">{card.title}</div>
        {card.description && (
          <div className="text-xs text-zinc-500 mt-2 line-clamp-2 whitespace-pre-wrap break-words">
            {card.description}
          </div>
        )}
        {(() => {
          try {
            const tags = JSON.parse(card.tags || "[]");
            if (tags.length > 0) {
              return (
                <div className="flex flex-wrap gap-1 mt-2">
                  {tags.map((tag: any, i: number) => (
                    <div
                      key={i}
                      className={cn("px-2 py-0.5 rounded text-[10px] font-semibold text-white", tag.color)}
                    >
                      {tag.name}
                    </div>
                  ))}
                </div>
              );
            }
          } catch (e) {
            return null;
          }
          return null;
        })()}
      </div>

      <CardModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        card={card}
      />
    </>
  );
}
