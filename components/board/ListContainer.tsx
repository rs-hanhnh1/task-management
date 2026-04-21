import { useEffect, useState } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  defaultDropAnimationSideEffects,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { List, Card } from "@/types";
import { ListItem } from "./ListItem";
import { ListForm } from "./ListForm";
import { CardItem } from "./CardItem";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

interface ListContainerProps {
  initialData: List[];
}

export function ListContainer({ initialData }: ListContainerProps) {
  const [lists, setLists] = useState<List[]>(initialData);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<"List" | "Card" | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    // eslint-disable-next-line
    setLists(initialData);
  }, [initialData]);

  const listIds = lists.map((list) => list.id);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const reorderListsMutation = useMutation({
    mutationFn: (items: { id: string; order: number }[]) =>
      axios.put("/api/lists/reorder", { items }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["lists"] }),
  });

  const reorderCardsMutation = useMutation({
    mutationFn: (items: { id: string; order: number; listId: string }[]) =>
      axios.put("/api/cards/reorder", { items }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["lists"] }),
  });

  const onDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const { id } = active;
    setActiveId(id as string);
    setActiveType(active.data.current?.type);
  };

  const onDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveCard = active.data.current?.type === "Card";
    const isOverCard = over.data.current?.type === "Card";
    const isOverList = over.data.current?.type === "List";

    if (!isActiveCard) return;

    // Moving a card over another card
    if (isActiveCard && isOverCard) {
      setLists((prev) => {
        const activeListIndex = prev.findIndex((l) =>
          l.cards.some((c) => c.id === activeId)
        );
        const overListIndex = prev.findIndex((l) =>
          l.cards.some((c) => c.id === overId)
        );

        if (activeListIndex === -1 || overListIndex === -1) return prev;

        const activeList = prev[activeListIndex];
        const overList = prev[overListIndex];

        const activeCardIndex = activeList.cards.findIndex(
          (c) => c.id === activeId
        );
        const overCardIndex = overList.cards.findIndex((c) => c.id === overId);

        if (activeListIndex === overListIndex) {
          // Same list
          const newCards = arrayMove(
            activeList.cards,
            activeCardIndex,
            overCardIndex
          );
          const newLists = [...prev];
          newLists[activeListIndex] = { ...activeList, cards: newCards };
          return newLists;
        } else {
          // Different list
          const newLists = [...prev];
          const [movedCard] = newLists[activeListIndex].cards.splice(
            activeCardIndex,
            1
          );
          movedCard.listId = overList.id;
          newLists[overListIndex].cards.splice(overCardIndex, 0, movedCard);
          return newLists;
        }
      });
    }

    // Moving a card over an empty list or into a list
    if (isActiveCard && isOverList) {
      setLists((prev) => {
        const activeListIndex = prev.findIndex((l) =>
          l.cards.some((c) => c.id === activeId)
        );
        const overListIndex = prev.findIndex((l) => l.id === overId);

        if (activeListIndex === -1 || overListIndex === -1) return prev;

        const activeList = prev[activeListIndex];
        const overList = prev[overListIndex];

        if (activeList.id === overList.id) return prev;

        const activeCardIndex = activeList.cards.findIndex(
          (c) => c.id === activeId
        );

        const newLists = [...prev];
        const [movedCard] = newLists[activeListIndex].cards.splice(
          activeCardIndex,
          1
        );
        movedCard.listId = overList.id;
        newLists[overListIndex].cards.push(movedCard);
        return newLists;
      });
    }
  };

  const onDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    setActiveType(null);

    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveList = active.data.current?.type === "List";
    const isActiveCard = active.data.current?.type === "Card";

    if (isActiveList) {
      setLists((prev) => {
        const activeIndex = prev.findIndex((l) => l.id === activeId);
        const overIndex = prev.findIndex((l) => l.id === overId);

        const newLists = arrayMove(prev, activeIndex, overIndex);
        
        // Update database
        const items = newLists.map((l, index) => ({ id: l.id, order: index + 1 }));
        reorderListsMutation.mutate(items);

        return newLists;
      });
    }

    if (isActiveCard) {
      // Find which list the card is now in and update all cards in that list, or just all cards
      const allCards = lists.flatMap((l) => l.cards);
      const items = lists.flatMap((l) =>
        l.cards.map((c, index) => ({ id: c.id, order: index + 1, listId: l.id }))
      );
      reorderCardsMutation.mutate(items);
    }
  };

  const activeList = lists.find((l) => l.id === activeId);
  const activeCard = lists
    .flatMap((l) => l.cards)
    .find((c) => c.id === activeId);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >
      <div className="flex gap-4 h-full">
        <SortableContext
          items={listIds}
          strategy={horizontalListSortingStrategy}
        >
          {lists.map((list) => (
            <ListItem key={list.id} list={list} />
          ))}
        </SortableContext>
        <ListForm />
      </div>

      <DragOverlay
        dropAnimation={{
          sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: "0.5" } } }),
        }}
      >
        {activeType === "List" && activeList ? (
          <ListItem list={activeList} isOverlay />
        ) : null}
        {activeType === "Card" && activeCard ? (
          <CardItem card={activeCard} isOverlay />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
