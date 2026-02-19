import { Trophy } from "lucide-react";

interface RankBadgeProps {
  rank: number;
}

const RankBadge = ({ rank }: RankBadgeProps) => {
  if (rank <= 0) return null;

  return (
    <div className="rank-badge absolute left-3 top-3 z-10 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold text-[hsl(var(--primary-foreground))] shadow-lg">
      <Trophy size={12} />
      <span>#{rank}</span>
    </div>
  );
};

export default RankBadge;
