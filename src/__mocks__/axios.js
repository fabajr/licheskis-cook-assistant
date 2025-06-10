// src/__mocks__/axios.js
import { vi } from 'vitest'

const axiosInstance = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  interceptors: {
    request: { use: vi.fn() },
    response: { use: vi.fn() },
  },
};

const axiosMock = {
  create: vi.fn(() => axiosInstance),
  ...axiosInstance,
};
export default axiosMock;

