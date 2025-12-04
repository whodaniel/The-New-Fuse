interface TTSMessageProps {
    slug: string;
    chatId: string;
    message: string;
}
export default function TTSMessage({ slug, chatId, message }: TTSMessageProps): JSX.Element;
export {};
