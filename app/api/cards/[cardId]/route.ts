import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ cardId: string }> }
) {
  try {
    const { title, description } = await req.json();
    const { cardId } = await params;

    const card = await db.card.update({
      where: {
        id: cardId,
      },
      data: {
        title,
        description,
      },
    });

    return NextResponse.json(card);
  } catch (error) {
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
