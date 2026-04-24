import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const lists = await prisma.list.findMany({
    include: {
      cards: true,
    },
    orderBy: {
      order: "asc",
    },
  });

  console.log(JSON.stringify(lists, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
