import { createTRPCRouter, protectedProcedure } from '../init';
import prisma from '@/lib/db';

export const appRouter = createTRPCRouter({

  //getUsers = ONLY for logged-in users
  getUsers: protectedProcedure.query(({ ctx }) => { 
    return prisma.user.findMany({
      where: {
        id: ctx.auth.user.id
      },
    });
  }),

});

// export type definition of API
export type AppRouter = typeof appRouter;
