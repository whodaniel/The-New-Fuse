import * as vscode from 'vscode';
import { CommandTransport } from '../../transport/command-transport.tsx';
import { TransportMessage } from '../../transport/transport-interface.tsx';

jest.mock('vscode');

describe('CommandTransport', () => {
    let transport: CommandTransport;

    beforeEach(() => {
        transport = new CommandTransport();
    });

    test('initialize registers commands', async () => {
        await transport.initialize();
        expect(vscode.commands.registerCommand).toHaveBeenCalled();
    });

    test('send executes command with message', async () => {
        const message: TransportMessage = {
            id: '1',
            type: 'test',
            payload: 'test',
            timestamp: Date.now()
        };
        
        await transport.send(message);
        expect(vscode.commands.executeCommand).toHaveBeenCalledWith(
            'newFuse.transport.send',
            message
        );
    });
});
