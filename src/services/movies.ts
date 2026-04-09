import { tmdb } from "./tmdb";

const requests = {
  fetchTrending: `/trending/all/week`,
  fetchNetflixOriginals: `/discover/tv?with_networks=213`,
  fetchTopRated: `/movie/top_rated`,
  fetchActionMovies: `/discover/movie?with_genres=28`,
  fetchComedyMovies: `/discover/movie?with_genres=35`,
  fetchHorrorMovies: `/discover/movie?with_genres=27`,
  fetchRomanceMovies: `/discover/movie?with_genres=10749`,
  fetchDocumentaries: `/discover/movie?with_genres=99`,
};

export const fetchMoviesData = async (url: string) => {
  const res = await tmdb.get(url);
  return res.data.results;
};

export { requests };

export const searchMovies = async (query: string) => {
  if (!query) return [];
  const res = await tmdb.get("/search/movie", {
    params: { query },
  });
  return res.data.results;
};

export const getMovieDetails = async (id: string) => {
  // Fetch all movie data in parallel
  const [details, credits, videos, similar] = await Promise.all([
    tmdb.get(`/movie/${id}`),
    tmdb.get(`/movie/${id}/credits`),
    tmdb.get(`/movie/${id}/videos`),
    tmdb.get(`/movie/${id}/similar`),
  ]);

  return {
    ...details.data,
    credits: credits.data,
    videos: videos.data.results,
    similar: similar.data.results,
  };
};