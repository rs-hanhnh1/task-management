import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ReorderListSchema } from "@/lib/validations/list";

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { items } = ReorderListSchema.parse(body);

    const transaction = items.map((list) =>
      db.list.update({
        where: {
          id: list.id,
        },
        data: {
          order: list.order,
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
