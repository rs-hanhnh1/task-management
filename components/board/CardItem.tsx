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
          "bg-zinc-800 hover:bg-zinc-700/80 hover:ring-1 hover:ring-zinc-600 transition-colors cursor-pointer text-sm p-3 rounded-lg shadow-sm border border-zinc-700/50 group text-zinc-200",
          isDragging && "opacity-50",
          isOverlay && "opacity-100 rotate-3 scale-105 shadow-xl ring-2 ring-blue-500"
        )}
      >
        {card.title}
      </div>

      <CardModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        card={card}
      />
    </>
  );
}
