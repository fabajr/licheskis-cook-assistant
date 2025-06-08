// src/App.test.js
jest.mock('axios');
const axios = require('axios');

import { render, screen } from '@testing-library/react';
import App from './App';

test('renders home page title', () => {
  render(<App />);
  const heading = screen.getByRole('heading', { name: /Licheskis Cook Assistant/i });
  expect(heading).toBeInTheDocument();
});