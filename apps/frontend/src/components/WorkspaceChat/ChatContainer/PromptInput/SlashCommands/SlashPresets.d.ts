interface SlashPresetsProps {
    sendCommand: (command: string, submit?: boolean) => void;
    setShowing: (showing: boolean) => void;
}
export default function SlashPresets({ sendCommand, setShowing }: SlashPresetsProps): import("react/jsx-runtime").JSX.Element;
export {};
