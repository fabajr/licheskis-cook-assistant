// src/App.test.js
import { vi } from 'vitest';
import axiosMock from './__mocks__/axios';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('./hooks/useAuth', () => ({
  useAuth: () => ({ user: null, isAdmin: false, hasHormonalCycle: false, logout: vi.fn() })
}));

vi.mock('axios', async () => ({
  default: axiosMock,
}));

import { render, screen } from '@testing-library/react';
import App from './App';

test('renders home page title', () => {
  render(
    <MemoryRouter>
      <App />
    </MemoryRouter>
  );
  const heading = screen.getByRole('heading', { name: /Licheskis Cook Assistant/i });
  expect(heading).toBeInTheDocument();
});
