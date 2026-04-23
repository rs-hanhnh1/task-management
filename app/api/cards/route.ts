import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { CreateCardSchema } from "@/lib/validations/card";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, listId, description, tags } = CreateCardSchema.parse(body);

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
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return new NextResponse("Invalid request data", { status: 400 });
    }
    return new NextResponse("Internal Error", { status: 500 });
  }
}
