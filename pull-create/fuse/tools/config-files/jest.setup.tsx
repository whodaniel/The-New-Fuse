import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

test('hello world!', () => {
    render(<div>Hello World</div>);
    expect(screen.getByText('Hello World')).toBeInTheDocument();
});