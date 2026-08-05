import React from 'react';
import { ChevronUp } from 'lucide-react';

interface VoteButtonProps {
  upvotes: number;
  hasVoted?: boolean;
  onVote: (e: React.MouseEvent) => void;
}

export const VoteButton: React.FC<VoteButtonProps> = ({ upvotes, hasVoted, onVote }) => {
  return (
    <button
      onClick={onVote}
      className={`flex flex-col items-center justify-center px-3 py-2 rounded-xl transition-all ${
        hasVoted
          ? 'bg-blue-600 text-white'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      <ChevronUp size={20} className={hasVoted ? 'text-white' : 'text-blue-600'} />
      <span className="font-bold text-sm mt-1">{upvotes}</span>
    </button>
  );
};