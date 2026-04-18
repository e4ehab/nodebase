import prisma from "@/lib/db";
import { json } from "stream/consumers";

const Page = async () => {
  const users = await prisma.user.findMany();
  return (
    <div>
      {JSON.stringify(users)}
    </div>
  );
}

export default Page;