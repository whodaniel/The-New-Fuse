interface SlashCommandsButtonProps {
    showing: boolean;
    setShowSlashCommand: (showing: boolean) => void;
}
interface SlashCommandsProps {
    showing: boolean;
    setShowing: (showing: boolean) => void;
    sendCommand: (command: string, submit?: boolean) => void;
}
interface UseSlashCommandsReturn {
    showSlashCommand: boolean;
    setShowSlashCommand: (showing: boolean) => void;
}
export default function SlashCommandsButton({ showing, setShowSlashCommand }: SlashCommandsButtonProps): JSX.Element;
export declare function SlashCommands({ showing, setShowing, sendCommand }: SlashCommandsProps): JSX.Element;
export declare function useSlashCommands(): UseSlashCommandsReturn;
export {};
