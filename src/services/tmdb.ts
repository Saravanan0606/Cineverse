import axios from "axios";

export const tmdb = axios.create({
  baseURL: "http://localhost:5000/api",
});