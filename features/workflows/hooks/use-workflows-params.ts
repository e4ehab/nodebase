import { useQueryStates } from "nuqs";
import { workflowsParams } from "../params";

export const useWorkflowsParams = () => {
  return useQueryStates(workflowsParams);
  // this returns an array of [params, setParams], where params is the current query params object (with page, pageSize, search), and setParams is a function to update the query params in the URL
};