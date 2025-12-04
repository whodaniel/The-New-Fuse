interface ResetCommandProps {
    sendCommand: (command: string, submit?: boolean) => void;
    setShowing: (showing: boolean) => void;
}
export default function ResetCommand({ sendCommand, setShowing }: ResetCommandProps): import("react/jsx-runtime").JSX.Element;
export {};
