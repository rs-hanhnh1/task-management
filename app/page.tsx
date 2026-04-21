"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { ListContainer } from "@/components/board/ListContainer";

export default function Home() {
  const { data: lists, isLoading } = useQuery({
    queryKey: ["lists"],
    queryFn: async () => {
      const { data } = await axios.get("/api/lists");
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-900 text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-zinc-900 text-white overflow-hidden flex flex-col">
      <header className="p-4 bg-zinc-950/50 backdrop-blur-sm border-b border-zinc-800">
        <h1 className="text-xl font-bold tracking-tight">Kanban Board</h1>
      </header>
      <main className="flex-1 overflow-x-auto p-4">
        <ListContainer initialData={lists || []} />
      </main>
    </div>
  );
}
