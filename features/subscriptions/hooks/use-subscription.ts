import { useQuery } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";

/*----------------------------------------------------------------------------------------------------------------------*/
// Hook 1: Fetches the customer's subscription state from Polar

export const useSubscription = () => {
    return useQuery({
        queryKey: ["subscription"],       // cache key — React Query uses this to store & reuse the result
        queryFn: async () => {
            const { data, error } = await authClient.customer.state(); // fetch subscription state from Polar (subscriptions, plan, billing, etc.")
            if (error) throw new Error(error.message || "Failed to fetch subscription state"); // if error, throw it so React Query marks it as failed
            return data;  // otherwise return the clean data
        },
    });
};

/*----------------------------------------------------------------------------------------------------------------------*/
// Hook 2: Determines if the user has an active subscription based on the data from useSubscription

export const useHasActiveSubscription = () => {
    const { data: customerState, isLoading, ...rest } = useSubscription(); // reuses hook 1

    const hasActiveSubscription =
        customerState?.activeSubscriptions &&
        customerState.activeSubscriptions.length > 0; // true if at least 1 active subscription exists

    return {
        hasActiveSubscription,     // boolean: is the user subscribed?
        subscription: customerState?.activeSubscriptions?.[0], // the actual subscription object (first one)
        isLoading,     // true while data is being fetched
        ...rest,     // error, isFetching, refetch, etc.
    };
}
/*----------------------------------------------------------------------------------------------------------------------*/
