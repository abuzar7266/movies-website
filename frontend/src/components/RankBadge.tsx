import { Trophy } from "lucide-react";
import styles from "./RankBadge.module.css";

interface RankBadgeProps {
  rank: number;
}

const RankBadge = ({ rank }: RankBadgeProps) => {
  if (rank <= 0) return null;

  return (
    <div className={styles.badge}>
      <Trophy size={12} />
      <span>#{rank}</span>
    </div>
  );
};

export default RankBadge;
