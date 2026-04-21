import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ listId: string }> }
) {
  try {
    const { title } = await req.json();
    const { listId } = await params;

    const list = await db.list.update({
      where: {
        id: listId,
      },
      data: {
        title,
      },
    });

    return NextResponse.json(list);
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ listId: string }> }
) {
  try {
    const { listId } = await params;
    
    const list = await db.list.delete({
      where: {
        id: listId,
      },
    });

    return NextResponse.json(list);
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 });
  }
}
