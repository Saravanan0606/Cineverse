import { useQuery } from "@tanstack/react-query";
import { getMovieDetails } from "../services/movies";

export const useMovieDetails = (id: string) => {
  return useQuery({
    queryKey: ["movie", id],
    queryFn: () => getMovieDetails(id),
    enabled: !!id,
  });
};