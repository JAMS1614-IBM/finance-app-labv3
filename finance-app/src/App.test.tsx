import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('App', () => {
  it('boots with the default (mock) provider and renders the dashboard end to end', async () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Market Dashboard' })).toBeInTheDocument();
    expect(await screen.findByRole('article', { name: 'IBM' })).toBeInTheDocument();
    expect(screen.getAllByRole('tab')).toHaveLength(3);
  });
});
