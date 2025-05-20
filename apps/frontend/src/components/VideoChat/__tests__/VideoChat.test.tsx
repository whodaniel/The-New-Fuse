
export {}
import react_1 from 'react';
import react_2 from '@testing-library/react';
import VideoChat_1 from '../VideoChat.js';
const mockMediaDevices = {
    getUserMedia: jest.fn()
};
const mockMediaStream = {
    getTracks: () => [{
            stop: jest.fn()
        }]
};
describe('VideoChat', () => {
    beforeAll(() => {
        Object.defineProperty(global.navigator, 'mediaDevices', {
            value: mockMediaDevices,
            writable: true
        });
    });
    beforeEach(() => {
        jest.clearAllMocks();
        mockMediaDevices.getUserMedia.mockResolvedValue(mockMediaStream);
    });
    it('renders video chat component with initial state', () => {
        (0, react_2.render)(<VideoChat_1.default />);
        expect(react_2.screen.getByText('Video Chat')).toBeInTheDocument();
        expect(react_2.screen.getByText('Turn on camera or microphone to start')).toBeInTheDocument();
    });
    it('handles camera toggle', async () => {
        (0, react_2.render)(<VideoChat_1.default />);
        const cameraButton = react_2.screen.getByRole('button', { name: /videocam/i });
        await (0, react_2.act)(async () => {
            react_2.fireEvent.click(cameraButton);
        });
        expect(mockMediaDevices.getUserMedia).toHaveBeenCalledWith({
            video: true,
            audio: false
        });
    });
    it('handles audio toggle', async () => {
        (0, react_2.render)(<VideoChat_1.default />);
        const audioButton = react_2.screen.getByRole('button', { name: /mic/i });
        await (0, react_2.act)(async () => {
            react_2.fireEvent.click(audioButton);
        });
        expect(mockMediaDevices.getUserMedia).toHaveBeenCalledWith({
            video: false,
            audio: true
        });
    });
    it('handles media access error', async () => {
        const errorMessage = 'Failed to access camera or microphone. Please check your permissions.';
        mockMediaDevices.getUserMedia.mockRejectedValue(new Error('Permission denied'));
        (0, react_2.render)(<VideoChat_1.default />);
        const cameraButton = react_2.screen.getByRole('button', { name: /videocam/i });
        await (0, react_2.act)(async () => {
            react_2.fireEvent.click(cameraButton);
        });
        expect(react_2.screen.getByText(errorMessage)).toBeInTheDocument();
    });
    it('stops media tracks when toggling off', async () => {
        const mockTrack = { stop: jest.fn() };
        const mockStreamWithTrack = {
            getTracks: () => [mockTrack]
        };
        mockMediaDevices.getUserMedia.mockResolvedValue(mockStreamWithTrack);
        (0, react_2.render)(<VideoChat_1.default />);
        const cameraButton = react_2.screen.getByRole('button', { name: /videocam/i });
        await (0, react_2.act)(async () => {
            react_2.fireEvent.click(cameraButton);
        });
        await (0, react_2.act)(async () => {
            react_2.fireEvent.click(cameraButton);
        });
        expect(mockTrack.stop).toHaveBeenCalled();
    });
    it('handles both camera and audio simultaneously', async () => {
        (0, react_2.render)(<VideoChat_1.default />);
        const cameraButton = react_2.screen.getByRole('button', { name: /videocam/i });
        const audioButton = react_2.screen.getByRole('button', { name: /mic/i });
        await (0, react_2.act)(async () => {
            react_2.fireEvent.click(cameraButton);
            react_2.fireEvent.click(audioButton);
        });
        expect(mockMediaDevices.getUserMedia).toHaveBeenCalledWith({
            video: true,
            audio: true
        });
    });
});
export {};
//# sourceMappingURL=VideoChat.test.js.map