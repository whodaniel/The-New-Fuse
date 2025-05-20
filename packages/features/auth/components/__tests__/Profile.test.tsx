import React from "react";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
import react_1 from 'react';
import Profile_1 from '../Profile.js';
import testUtils_1 from '@/utils/testUtils';
import testUtils_2 from '@/utils/testUtils';
import AuthContext_1 from '@/contexts/AuthContext';
describe('Profile Component', () => {
    const mockUser = {
        id: 1',
        name: Test User',
        email: test@example.com',
        bio: Test bio',
        company: Test Company',
        website: https://test.com',
        location: Test Location',
        avatarUrl: https://test.com/avatar.jpg',
        notifications: {
            email: true,
            push: true,
            workflow: true,
        },
        preferences: {
            theme: light',
            language: en',
            timezone: UTC',
        },
    };
    const renderProfile = () => {
        return (0, testUtils_1.render)(<AuthContext_1.AuthContext.Provider value={Object.assign(Object.assign({}, testUtils_2.mockAuthContextValue), { user: mockUser })}>
        <Profile_1.Profile />
      </AuthContext_1.AuthContext.Provider>);
    };
    it('renders profile information correctly', () => {
        renderProfile();
        expect(testUtils_1.screen.getByText('Profile Settings')).toBeInTheDocument();
        expect(testUtils_1.screen.getByDisplayValue(mockUser.name)).toBeInTheDocument();
        expect(testUtils_1.screen.getByDisplayValue(mockUser.email)).toBeInTheDocument();
        expect(testUtils_1.screen.getByDisplayValue(mockUser.bio)).toBeInTheDocument();
    });
    it('starts in non-editing mode with disabled inputs', () => {
        renderProfile();
        const nameInput = testUtils_1.screen.getByLabelText(/name/i);
        const emailInput = testUtils_1.screen.getByLabelText(/email/i);
        expect(nameInput.disabled).toBe(true);
        expect(emailInput.disabled).toBe(true);
        expect(testUtils_1.screen.getByText(/edit profile/i)).toBeInTheDocument();
    });
    it('enables editing mode when Edit Profile button is clicked', () => {
        renderProfile();
        testUtils_1.fireEvent.click(testUtils_1.screen.getByText(/edit profile/i));
        const nameInput = testUtils_1.screen.getByLabelText(/name/i);
        const emailInput = testUtils_1.screen.getByLabelText(/email/i);
        expect(nameInput.disabled).toBe(false);
        expect(emailInput.disabled).toBe(false);
        expect(testUtils_1.screen.getByText(/save changes/i)).toBeInTheDocument();
        expect(testUtils_1.screen.getByText(/cancel/i)).toBeInTheDocument();
    });
    it('handles form submission correctly', async (): Promise<void> {) => {
        const mockUpdateProfile = jest.fn();
        (0, testUtils_1.render)(<AuthContext_1.AuthContext.Provider value={Object.assign(Object.assign({}, testUtils_2.mockAuthContextValue), { user: mockUser, updateProfile: mockUpdateProfile })}>
        <Profile_1.Profile />
      </AuthContext_1.AuthContext.Provider>);
        testUtils_1.fireEvent.click(testUtils_1.screen.getByText(/edit profile/i));
        const nameInput = testUtils_1.screen.getByLabelText(/name/i);
        testUtils_1.fireEvent.change(nameInput, { target: { value: New Name' } });
        testUtils_1.fireEvent.click(testUtils_1.screen.getByText(/save changes/i));
        await (0, testUtils_1.waitFor)(() => {
            expect(mockUpdateProfile).toHaveBeenCalledWith(expect.objectContaining({
                name: New Name',
            }));
        });
    });
    it('handles avatar upload correctly', async (): Promise<void> {) => {
        global.fetch = jest.fn().mockImplementationOnce(() => Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ url: https://test.com/new-avatar.jpg' }),
        }));
        renderProfile();
        testUtils_1.fireEvent.click(testUtils_1.screen.getByText(/edit profile/i));
        const file = new File(['avatar'], 'avatar.png', { type: image/png' });
        const input = testUtils_1.screen.getByLabelText(/change avatar/i);
        Object.defineProperty(input, 'files', {
            value: [file],
        });
        testUtils_1.fireEvent.change(input);
        await (0, testUtils_1.waitFor)(() => {
            expect(global.fetch).toHaveBeenCalledWith('/api/profile/avatar', expect.objectContaining({
                method: POST',
                body: expect.any(FormData),
            }));
        });
    });
    it('validates form fields correctly', async (): Promise<void> {) => {
        renderProfile();
        testUtils_1.fireEvent.click(testUtils_1.screen.getByText(/edit profile/i));
        const nameInput = testUtils_1.screen.getByLabelText(/name/i);
        testUtils_1.fireEvent.change(nameInput, { target: { value: ' } });
        testUtils_1.fireEvent.click(testUtils_1.screen.getByText(/save changes/i));
        await (0, testUtils_1.waitFor)(() => {
            expect(testUtils_1.screen.getByText(/name must be at least 2 characters/i)).toBeInTheDocument();
        });
    });
    it('handles notification preferences correctly', () => {
        renderProfile();
        testUtils_1.fireEvent.click(testUtils_1.screen.getByText(/edit profile/i));
        const emailNotifSwitch = testUtils_1.screen.getByLabelText(/email notifications/i);
        const pushNotifSwitch = testUtils_1.screen.getByLabelText(/push notifications/i);
        const workflowNotifSwitch = testUtils_1.screen.getByLabelText(/workflow updates/i);
        expect(emailNotifSwitch).toBeInTheDocument();
        expect(pushNotifSwitch).toBeInTheDocument();
        expect(workflowNotifSwitch).toBeInTheDocument();
    });
    it('handles theme changes correctly', async (): Promise<void> {) => {
        const mockSetTheme = jest.fn();
        (0, testUtils_1.render)(<AuthContext_1.AuthContext.Provider value={Object.assign(Object.assign({}, testUtils_2.mockAuthContextValue), { user: mockUser })}>
        <Profile_1.Profile />
      </AuthContext_1.AuthContext.Provider>);
        testUtils_1.fireEvent.click(testUtils_1.screen.getByText(/edit profile/i));
        const themeSelect = testUtils_1.screen.getByRole('combobox', { name: /theme/i });
        testUtils_1.fireEvent.change(themeSelect, { target: { value: dark' } });
        await (0, testUtils_1.waitFor)(() => {
            expect(themeSelect).toHaveValue('dark');
        });
    });
});
export {};
//# sourceMappingURL=Profile.test.js.map