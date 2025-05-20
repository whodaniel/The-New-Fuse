import * as vscode from 'vscode';
import { CommandTransport } from '../../transport/command-transport.js';
import { TransportMessage } from '../../transport/transport-interface.js';

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
