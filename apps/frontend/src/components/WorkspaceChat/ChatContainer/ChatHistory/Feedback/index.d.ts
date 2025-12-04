interface FeedbackButtonsProps {
    chatId: string;
    slug: string;
    feedbackScore?: number | null;
}
export default function FeedbackButtons({ chatId, slug, feedbackScore, }: FeedbackButtonsProps): JSX.Element;
export {};
