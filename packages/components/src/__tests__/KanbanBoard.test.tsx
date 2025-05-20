import { render, screen, fireEvent } from '@testing-library/react';
import { KanbanBoard } from '../components/KanbanBoard.js';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

const mockItems = [
  { id: '1', title: 'Task 1', status: 'TODO' },
  { id: '2', title: 'Task 2', status: 'IN_PROGRESS' },
  { id: '3', title: 'Task 3', status: 'DONE' }
];

const defaultProps = {
  items: mockItems,
  onMoveItem: jest.fn(),
  onAddItem: jest.fn(),
  onEditItem: jest.fn(),
  onDeleteItem: jest.fn(),
};

const renderKanbanBoard = (props = {}) => {
  return render(
    <DndProvider backend={HTML5Backend}>
      <KanbanBoard {...defaultProps} {...props} />
    </DndProvider>
  );
};

describe('KanbanBoard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all columns and items', () => {
    renderKanbanBoard();
    
    expect(screen.getByText('To Do')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('Done')).toBeInTheDocument();
    
    expect(screen.getByText('Task 1')).toBeInTheDocument();
    expect(screen.getByText('Task 2')).toBeInTheDocument();
    expect(screen.getByText('Task 3')).toBeInTheDocument();
  });

  it('triggers onAddItem when add button is clicked', () => {
    renderKanbanBoard();
    
    const addButton = screen.getByRole('button', { name: /add item/i });
    fireEvent.click(addButton);
    
    expect(defaultProps.onAddItem).toHaveBeenCalledWith('TODO');
  });

  it('triggers onEditItem when edit button is clicked', () => {
    renderKanbanBoard();
    
    const editButton = screen.getAllByRole('button', { name: /edit/i })[0];
    fireEvent.click(editButton);
    
    expect(defaultProps.onEditItem).toHaveBeenCalledWith('1');
  });

  it('triggers onDeleteItem when delete button is clicked', () => {
    renderKanbanBoard();
    
    const deleteButton = screen.getAllByRole('button', { name: /delete/i })[0];
    fireEvent.click(deleteButton);
    
    expect(defaultProps.onDeleteItem).toHaveBeenCalledWith('1');
  });

  it('handles keyboard navigation', () => {
    renderKanbanBoard();
    
    const firstItem = screen.getByText('Task 1').closest('[role="listitem"]');
    firstItem?.focus();
    
    fireEvent.keyDown(firstItem!, { key: 'ArrowRight' });
    expect(defaultProps.onMoveItem).toHaveBeenCalledWith('1', 'IN_PROGRESS');
    
    fireEvent.keyDown(firstItem!, { key: 'ArrowLeft' });
    expect(defaultProps.onMoveItem).toHaveBeenCalledWith('1', 'TODO');
  });

  it('applies search filter correctly', () => {
    renderKanbanBoard({ searchTerm: 'Task 2' });
    
    expect(screen.queryByText('Task 1')).not.toBeInTheDocument();
    expect(screen.getByText('Task 2')).toBeInTheDocument();
    expect(screen.queryByText('Task 3')).not.toBeInTheDocument();
  });

  it('handles batch selection', () => {
    renderKanbanBoard();
    
    const items = screen.getAllByRole('listitem');
    fireEvent.click(items[0], { ctrlKey: true });
    fireEvent.click(items[1], { ctrlKey: true });
    
    expect(items[0]).toHaveAttribute('aria-selected', 'true');
    expect(items[1]).toHaveAttribute('aria-selected', 'true');
    expect(items[2]).toHaveAttribute('aria-selected', 'false');
  });
});