interface EndAgentSessionProps {
    sendCommand: (command: string, submit?: boolean) => void;
    setShowing: (showing: boolean) => void;
}
export default function EndAgentSession({ sendCommand, setShowing }: EndAgentSessionProps): import("react/jsx-runtime").JSX.Element;
export {};
