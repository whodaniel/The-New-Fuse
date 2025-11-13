import { render, screen } from '@testing-library/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../Card';
describe('Card', () => {
    it('renders correctly', () => {
        render(<Card>Card content</Card>);
        expect(screen.getByText('Card content')).toBeInTheDocument();
    });
    it('renders with title and description', () => {
        render(<Card>
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>Card Description</CardDescription>
        </CardHeader>
        <CardContent>Card Content</CardContent>
      </Card>);
        expect(screen.getByText('Card Title')).toBeInTheDocument();
        expect(screen.getByText('Card Description')).toBeInTheDocument();
        expect(screen.getByText('Card Content')).toBeInTheDocument();
    });
    it('renders with footer', () => {
        render(<Card>
        <CardContent>Card Content</CardContent>
        <CardFooter>Card Footer</CardFooter>
      </Card>);
        expect(screen.getByText('Card Content')).toBeInTheDocument();
        expect(screen.getByText('Card Footer')).toBeInTheDocument();
    });
    it('renders with custom className', () => {
        render(<Card className="custom-class">Card content</Card>);
        expect(screen.getByText('Card content').parentElement).toHaveClass('custom-class');
    });
    it('renders with different variants', () => {
        const { rerender } = render(<Card variant="default">Default Card</Card>);
        expect(screen.getByText('Default Card').parentElement).toHaveClass('bg-card');
        rerender(<Card variant="outline">Outline Card</Card>);
        expect(screen.getByText('Outline Card').parentElement).toHaveClass('border');
    });
    it('renders with different sizes', () => {
        const { rerender } = render(<Card size="default">Default Size</Card>);
        expect(screen.getByText('Default Size').parentElement).toHaveClass('p-6');
        rerender(<Card size="sm">Small Size</Card>);
        expect(screen.getByText('Small Size').parentElement).toHaveClass('p-4');
        rerender(<Card size="lg">Large Size</Card>);
        expect(screen.getByText('Large Size').parentElement).toHaveClass('p-8');
    });
    it('renders with hover effect', () => {
        render(<Card hoverable>Hover Card</Card>);
        expect(screen.getByText('Hover Card').parentElement).toHaveClass('hover:shadow-md');
    });
});
//# sourceMappingURL=Card.test.js.map