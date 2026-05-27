// This file does one simple thing: it reads the URL and turns it into typed data your app can use.  
// {loads the params from the URL}

import { createLoader } from "nuqs/server";
import { workflowsParams } from "../params";

export const workflowsParamsLoader = createLoader(workflowsParams);