// src/__mocks__/axios.js
const axiosInstance = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  interceptors: {
    request: { use: jest.fn() },
    response: { use: jest.fn() },
  },
};

const axiosMock = {
  create: jest.fn(() => axiosInstance),
  ...axiosInstance,
};

module.exports = axiosMock;
