import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const lists = await db.list.findMany({
      include: {
        cards: {
          orderBy: {
            order: "asc",
          },
        },
      },
      orderBy: {
        order: "asc",
      },
    });

    return NextResponse.json(lists);
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { title } = await req.json();

    const lastList = await db.list.findFirst({
      orderBy: { order: "desc" },
      select: { order: true },
    });

    const newOrder = lastList ? lastList.order + 1 : 1;

    const list = await db.list.create({
      data: {
        title,
        order: newOrder,
      },
      include: {
        cards: true,
      }
    });

    return NextResponse.json(list);
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 });
  }
}
