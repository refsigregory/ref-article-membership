import { AxiosInstance } from 'axios';

declare global {
  interface Window {
    api: AxiosInstance;
  }
} 