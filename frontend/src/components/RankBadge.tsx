import { Trophy } from "lucide-react";

interface RankBadgeProps {
  rank: number;
}

const RankBadge = ({ rank }: RankBadgeProps) => {
  if (rank > 3) return null;

  return (
    <div className="absolute left-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-indigo-600 px-2.5 py-1 text-xs font-bold text-white shadow-lg">
      <Trophy size={12} />
      <span>#{rank}</span>
    </div>
  );
};

export default RankBadge;
