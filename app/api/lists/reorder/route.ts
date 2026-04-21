import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PUT(req: Request) {
  try {
    const { items } = await req.json();

    const transaction = items.map((list: { id: string; order: number }) =>
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
    return new NextResponse("Internal Error", { status: 500 });
  }
}
