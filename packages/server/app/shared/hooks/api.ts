import { useMutation, useQuery } from "@tanstack/react-query";
import { MINUTE } from "../config/constants";
import apiClient from "../utils/apiClient";

const api = {

  useContests: () => useQuery({
    queryKey: ["contests"],
    queryFn: async () => {
      const res = await apiClient.contests.$get()
      const data = await res.json();
      return data;
    },
    staleTime: 10 * MINUTE,
  })

};

export default api;
