import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Shopify order reporter heading', () => {
  render(<App />);
  const heading = screen.getByRole('heading', { name: /shopify order reporter/i });
  expect(heading).toBeInTheDocument();
});
