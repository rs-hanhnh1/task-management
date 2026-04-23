import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ReorderCardSchema } from "@/lib/validations/card";

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { items } = ReorderCardSchema.parse(body);

    const transaction = items.map((card) =>
      db.card.update({
        where: {
          id: card.id,
        },
        data: {
          order: card.order,
          listId: card.listId,
        },
      })
    );

    await db.$transaction(transaction);

    return new NextResponse("Success", { status: 200 });
  } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
      return new NextResponse("Invalid request data", { status: 400 });
    }
    return new NextResponse("Internal Error", { status: 500 });
  }
}
