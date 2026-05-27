// for page pagination and search query params in workflows page

import { parseAsInteger, parseAsString } from "nuqs/server"; 
// "nuqs/server" works both in client and server components, but "nuqs" works only in client components, so we use "nuqs/server" here to ensure it works in both contexts
import { PAGINATION } from "@/config/constants";

export const workflowsParams = {
  page: parseAsInteger
    .withDefault(PAGINATION.DEFAULT_PAGE)
    .withOptions({ clearOnDefault: true }),
    /*
     * if we are on localhost:3000/workflows?page=1, and PAGINATION.DEFAULT_PAGE is 1,
     * then the page param will be cleared from the URL, so it will become localhost:3000/workflows
    */  
  pageSize: parseAsInteger
    .withDefault(PAGINATION.DEFAULT_PAGE_SIZE)
    .withOptions({ clearOnDefault: true }),
  search: parseAsString
    .withDefault("")
    .withOptions({ clearOnDefault: true }),
};