import { renderHook, act } from '@testing-library/react-hooks';
import { useServices } from '../useServices.js';
import { api } from '../../services/api.js';

jest.mock('../../services/api');

describe('useServices', () => {
  it('should load services', async () => {
    const mockServices = [
      { id: '1', name: 'Service 1', status: 'ACTIVE' }
    ];
    
    (api.get as jest.Mock).mockResolvedValueOnce({ data: mockServices });

    const { result, waitForNextUpdate } = renderHook(() => useServices());

    await waitForNextUpdate();

    expect(result.current.services).toEqual(mockServices);
  });
});
