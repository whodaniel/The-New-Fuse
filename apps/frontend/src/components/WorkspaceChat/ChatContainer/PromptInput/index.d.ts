import React from "react";
export declare const PROMPT_INPUT_EVENT = "set_prompt_input";
interface PromptInputProps {
    submit: (event: React.FormEvent) => void;
    onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
    inputDisabled: boolean;
    buttonDisabled: boolean;
    sendCommand: (command: string, submit?: boolean) => void;
    attachments?: File[];
}
export default function PromptInput({ submit, onChange, inputDisabled, buttonDisabled, sendCommand, attachments, }: PromptInputProps): React.ReactElement;
export {};
