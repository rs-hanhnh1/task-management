import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { title, listId, description, tags } = await req.json();

    const lastCard = await db.card.findFirst({
      where: { listId },
      orderBy: { order: "desc" },
      select: { order: true },
    });

    const newOrder = lastCard ? lastCard.order + 1 : 1;

    const card = await db.card.create({
      data: {
        title,
        listId,
        description,
        tags,
        order: newOrder,
      },
    });

    return NextResponse.json(card);
  } catch (error: any) {
    console.error("[CARDS_POST]", error);
    return new NextResponse(error.message || "Internal Error", { status: 500 });
  }
}
