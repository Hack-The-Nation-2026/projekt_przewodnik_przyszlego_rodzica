import axios from 'axios'

// Adres API bierzemy ze zmiennej środowiskowej, a bez niej celujemy w lokalny backend.
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api',
  headers: { 'Content-Type': 'application/json' },
})
