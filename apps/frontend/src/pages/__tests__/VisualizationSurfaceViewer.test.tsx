import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import VisualizationSurfaceViewer from '../VisualizationSurfaceViewer';

describe('VisualizationSurfaceViewer', () => {
  test('renders a valid visualization surface iframe from query params', () => {
    render(
      <MemoryRouter
        initialEntries={[
          '/visualizations/surface?src=%2Fvisualizations%2Fagent-communication-flow.html&title=Agent%20Communication%20Flow&section=System%20Views',
        ]}
      >
        <Routes>
          <Route path="/visualizations/surface" element={<VisualizationSurfaceViewer />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /agent communication flow/i })).toBeInTheDocument();
    const frame = screen.getByTitle(/agent communication flow/i);
    expect(frame).toHaveAttribute('src', '/visualizations/agent-communication-flow.html');
  });

  test('blocks invalid visualization surface sources', () => {
    render(
      <MemoryRouter
        initialEntries={[
          '/visualizations/surface?src=https%3A%2F%2Fevil.example%2Fpayload.html&title=Bad',
        ]}
      >
        <Routes>
          <Route path="/visualizations/surface" element={<VisualizationSurfaceViewer />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/invalid surface request/i)).toBeInTheDocument();
    expect(screen.getByText(/source is blocked/i)).toBeInTheDocument();
  });

  test('normalizes extensionless dashboard alias to html surface', () => {
    render(
      <MemoryRouter initialEntries={['/visualizations/surface?src=%2Fvisualizations%2Fdashboard']}>
        <Routes>
          <Route path="/visualizations/surface" element={<VisualizationSurfaceViewer />} />
        </Routes>
      </MemoryRouter>
    );

    const frame = screen.getByTitle(/dashboard/i);
    expect(frame).toHaveAttribute('src', '/visualizations/dashboard.html');
  });
});
