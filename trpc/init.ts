import { initTRPC, TRPCError } from '@trpc/server';
import { cache } from 'react';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { polarClient } from '@/lib/polar';
import superjson from 'superjson';


export const createTRPCContext = cache(async () => {
  /**
   * @see: https://trpc.io/docs/server/context
   */
  return { userId: 'user_123' };
});

// Avoid exporting the entire t-object
// since it's not very descriptive.
// For instance, the use of a t variable
// is common in i18n libraries.
const t = initTRPC.create({
  /**
   * @see https://trpc.io/docs/server/data-transformers
   */
  transformer: superjson,
});

// Base router and procedure helpers
export const createTRPCRouter = t.router;

export const createCallerFactory = t.createCallerFactory;

export const baseProcedure = t.procedure;

export const protectedProcedure = baseProcedure.use(async ({ ctx, next }) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Unauthorized'
    });
  }
  return next({ ctx: { ...ctx, auth: session } }); //extend the object that next will send by extending the context and add the auth object as the session
})

export const premiumProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  //get the customer from polar using the user id from the session (cth.auth.user.id)
  const customer = await polarClient.customers.getStateExternal({
    externalId: ctx.auth.user.id
  });
  //if the customer doesn't have an active subscription, throw an error
  if (!customer.activeSubscriptions || customer.activeSubscriptions.length === 0) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'You need an active subscription to access this resource'
    });
  }
  // other wise we can retrurn next and add premuim features to the customer using the premiumProcedure adnd it will throw an error if the user doesn't have an active subscription
  return next({ ctx: { ...ctx, customer } });
})