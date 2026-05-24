// lib/auth.ts

import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "@/lib/db";
import { polar, checkout, portal } from "@polar-sh/better-auth";
import { polarClient } from "./polar";

export const auth = betterAuth({

  database: prismaAdapter(
    prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true, //so after registering sign in auutomatically , instead of sign in after registering
  },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    },
  },

  // polar configs  <--
  plugins: [
    polar({
      client: polarClient,
      createCustomerOnSignUp: true,
      use: [
        checkout({
          products: [
            {
              productId: process.env.pro_product_id as string, // ID of Product from Polar Dashboard
              slug: "pro" // Custom slug for easy reference in Checkout URL, e.g. /checkout/pro
            }
          ],
          successUrl: process.env.polar_success_url as string, // URL to redirect to after successful checkout 
          authenticatedUsersOnly: true
        }),
        portal(),
      ],
    })
  ]

});