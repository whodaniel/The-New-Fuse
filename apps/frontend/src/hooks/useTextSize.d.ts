type TextSize = 'sm' | 'md' | 'lg';
interface UseTextSizeReturn {
    textSize: TextSize;
    textSizeClass: string;
    setTextSize: (size: TextSize) => void;
}
export default function useTextSize(): UseTextSizeReturn;
export {};
