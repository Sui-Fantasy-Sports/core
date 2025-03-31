import { useMutation, useQuery } from "@tanstack/react-query";
import { MINUTE } from "../config/constants";
import apiClient from "../utils/apiClient";

const api = {
  useDummyContests: () =>
    useQuery({
      queryKey: ["dummycontests"],
      queryFn: async () => {
        const res = await apiClient.dummy.contests.$get()
        const { contests } = await res.json();
        return contests;
      },
      staleTime: 10 * MINUTE,
    }),

  useMkc: () => useQuery({
    queryKey: ["mkc"],
    queryFn: async () => {
      const res = await apiClient.dummy.mkc.$get()
      const { message } = await res.json();
      return message;
    },
    staleTime: 10 * MINUTE,
  }),

  useNewContest: () => useMutation({
    mutationFn: async (args: { name: string }) => {
      const res = await apiClient.contests.new.$post({ json: { name: args.name } })
      return res.json()
    },
  })
};

export default api;
