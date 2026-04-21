import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { UpdateCardSchema } from "@/lib/validations/card";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ cardId: string }> }
) {
  try {
    const body = await req.json();
    const { title, description, tags } = UpdateCardSchema.parse(body);
    const { cardId } = await params;

    const card = await db.card.update({
      where: {
        id: cardId,
      },
      data: {
        title,
        description,
        tags,
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

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ cardId: string }> }
) {
  try {
    const { cardId } = await params;
    
    const card = await db.card.delete({
      where: {
        id: cardId,
      },
    });

    return NextResponse.json(card);
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 });
  }
}
