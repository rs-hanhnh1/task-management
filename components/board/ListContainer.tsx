import { useEffect, useState, useRef } from "react";
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
  
  // Use a ref to always have access to the latest state in event handlers
  const listsRef = useRef<List[]>(lists);
  
  useEffect(() => {
    listsRef.current = lists;
  }, [lists]);

  // Sync with server data only when not performing optimistic updates
  useEffect(() => {
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
    onMutate: async (items) => {
      await queryClient.cancelQueries({ queryKey: ["lists"] });
      const previousLists = queryClient.getQueryData<List[]>(["lists"]);
      
      // Optimistically update the cache
      if (previousLists) {
        const newLists = [...previousLists];
        items.forEach((item) => {
          const list = newLists.find((l) => l.id === item.id);
          if (list) list.order = item.order;
        });
        newLists.sort((a, b) => a.order - b.order);
        queryClient.setQueryData(["lists"], newLists);
      }
      
      return { previousLists };
    },
    onError: (err, newItems, context) => {
      if (context?.previousLists) {
        queryClient.setQueryData(["lists"], context.previousLists);
        setLists(context.previousLists);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["lists"] });
    },
  });

  const reorderCardsMutation = useMutation({
    mutationFn: (items: { id: string; order: number; listId: string }[]) =>
      axios.put("/api/cards/reorder", { items }),
    onMutate: async (items) => {
      await queryClient.cancelQueries({ queryKey: ["lists"] });
      const previousLists = queryClient.getQueryData<List[]>(["lists"]);
      
      // The lists state in ListContainer is already optimistically updated by onDragOver
      // So we use it to update the query cache
      queryClient.setQueryData(["lists"], listsRef.current);
      
      return { previousLists };
    },
    onError: (err, newItems, context) => {
      if (context?.previousLists) {
        queryClient.setQueryData(["lists"], context.previousLists);
        setLists(context.previousLists);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["lists"] });
    },
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
          const newActiveCards = [...activeList.cards];
          const [movedCard] = newActiveCards.splice(activeCardIndex, 1);
          
          const newOverCards = [...overList.cards];
          newOverCards.splice(overCardIndex, 0, {
            ...movedCard,
            listId: overList.id
          });

          const newLists = [...prev];
          newLists[activeListIndex] = { ...activeList, cards: newActiveCards };
          newLists[overListIndex] = { ...overList, cards: newOverCards };
          
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

        const newActiveCards = [...activeList.cards];
        const [movedCard] = newActiveCards.splice(activeCardIndex, 1);
        
        const newOverCards = [...overList.cards, {
          ...movedCard,
          listId: overList.id
        }];

        const newLists = [...prev];
        newLists[activeListIndex] = { ...activeList, cards: newActiveCards };
        newLists[overListIndex] = { ...overList, cards: newOverCards };
        
        return newLists;
      });
    }
  };

  const onDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    setActiveType(null);

    const { active, over } = event;
    
    // If we dropped outside or the position didn't change in a meaningful way for lists,
    // we should still ensure the DB is in sync with the final UI state if it moved during onDragOver.
    // However, for lists, the move only happens in onDragEnd.
    
    if (!over) {
      // If we dropped outside, revert UI state to server state to be safe
      setLists(initialData);
      return;
    }

    const activeId = active.id;
    const overId = over.id;

    const isActiveList = active.data.current?.type === "List";
    const isActiveCard = active.data.current?.type === "Card";

    if (isActiveList) {
      if (activeId === overId) return;

      const activeIndex = lists.findIndex((l) => l.id === activeId);
      const overIndex = lists.findIndex((l) => l.id === overId);

      if (activeIndex !== -1 && overIndex !== -1) {
        const newLists = arrayMove(lists, activeIndex, overIndex);
        setLists(newLists);
        
        // Update database
        const items = newLists.map((l, index) => ({ id: l.id, order: index + 1 }));
        reorderListsMutation.mutate(items);
      }
    }

    if (isActiveCard) {
      // Use the latest state from the ref to avoid stale closure issues
      const currentLists = listsRef.current;
      const items = currentLists.flatMap((l) =>
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
