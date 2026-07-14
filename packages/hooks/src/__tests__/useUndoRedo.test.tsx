import { renderHook, act } from '@testing-library/react-hooks';
import { useUndoRedo } from '../hooks/useUndoRedo.js';

describe('useUndoRedo', () => {
  it('should initialize with initial state', () => {
    const { result } = renderHook(() => useUndoRedo('initial'));
    expect(result.current.state).toBe('initial');
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });

  it('should update state and enable undo', () => {
    const { result } = renderHook(() => useUndoRedo('initial'));

    act(() => {
      result.current.set('updated');
    });

    expect(result.current.state).toBe('updated');
    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(false);
  });

  it('should undo and redo changes', () => {
    const { result } = renderHook(() => useUndoRedo('initial'));

    act(() => {
      result.current.set('state1');
    });
    act(() => {
      result.current.set('state2');
    });

    expect(result.current.state).toBe('state2');

    act(() => {
      result.current.undo();
    });
    expect(result.current.state).toBe('state1');
    expect(result.current.canRedo).toBe(true);

    act(() => {
      result.current.redo();
    });
    expect(result.current.state).toBe('state2');
  });

  it('should handle batch operations', () => {
    const { result } = renderHook(() => useUndoRedo('initial'));

    act(() => {
      result.current.startBatch();
      result.current.addToBatch('batch1');
      result.current.addToBatch('batch2');
      result.current.addToBatch('batch3');
      result.current.commitBatch();
    });

    expect(result.current.state).toBe('batch3');
    
    act(() => {
      result.current.undo();
    });
    
    expect(result.current.state).toBe('initial');
  });

  it('should reset state history', () => {
    const { result } = renderHook(() => useUndoRedo('initial'));

    act(() => {
      result.current.set('state1');
      result.current.set('state2');
    });

    act(() => {
      result.current.reset('new-initial');
    });

    expect(result.current.state).toBe('new-initial');
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });
});