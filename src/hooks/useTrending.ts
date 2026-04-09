import { useQuery } from "@tanstack/react-query";
import { getTrendingMovies } from "../services/movies";

export const useTrending = () => {
  return useQuery({
    queryKey: ["trending"],
    queryFn: getTrendingMovies,
  });
};