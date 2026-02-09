import React, { useState } from "react";
import { ThumbsUp, ThumbsDown } from "@phosphor-icons/react";
import Workspace from "@/models/workspace";

interface FeedbackButtonsProps {
  chatId: string;
  slug: string;
  feedbackScore?: number | null;
}

export default function FeedbackButtons({
  chatId,
  slug,
  feedbackScore,
}: FeedbackButtonsProps): JSX.Element {
  const [currentScore, setCurrentScore] = useState<number | null>(feedbackScore ?? null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleFeedback = async (score: number) => {
    if (isSubmitting || currentScore === score) return;

    setIsSubmitting(true);
    try {
      await Workspace.submitMessageFeedback(slug, chatId, score);
      setCurrentScore(score);
    } catch (error) {
      console.error("Failed to submit feedback:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex gap-x-2 items-center">
      <button
        onClick={() => handleFeedback(1)}
        className={`text-white/40 hover:text-white/80 ${
          currentScore === 1 ? "!text-green-500" : ""
        }`}
        disabled={isSubmitting}
      >
        <ThumbsUp className="w-4 h-4" />
      </button>
      <button
        onClick={() => handleFeedback(-1)}
        className={`text-white/40 hover:text-white/80 ${
          currentScore === -1 ? "!text-red-500" : ""
        }`}
        disabled={isSubmitting}
      >
        <ThumbsDown className="w-4 h-4" />
      </button>
    </div>
  );
}