import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { UpdateListSchema } from "@/lib/validations/list";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ listId: string }> }
) {
  try {
    const body = await req.json();
    const { title } = UpdateListSchema.parse(body);
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
    if (error instanceof Error && error.name === "ZodError") {
      return new NextResponse("Invalid request data", { status: 400 });
    }
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
