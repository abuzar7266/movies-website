import SearchBar from "@components/SearchBar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import { Button } from "@components/ui/button";
import { DEFAULT_LABELS_EN, makeRatingOptions, makeReviewScopeOptions, makeSortOptions } from "@lib/options";
import type { ReviewScope, StarsValue, SortKey } from "@lib/options";
import styles from "./FiltersBar.module.css";

interface FiltersBarProps {
  searchQuery: string;
  onSearch: (q: string) => void;
  minStars: "0" | "1" | "2" | "3" | "4" | "5";
  onMinStars: (v: FiltersBarProps["minStars"]) => void;
  reviewScope: "all" | "mine" | "not_mine";
  onReviewScope: (v: FiltersBarProps["reviewScope"]) => void;
  sortBy: SortKey;
  onSortBy: (v: FiltersBarProps["sortBy"]) => void;
  onReset: () => void;
  canReset?: boolean;
  isAuthenticated: boolean;
  onRequireLogin: () => void;
}

export default function FiltersBar({
  searchQuery,
  onSearch,
  minStars,
  onMinStars,
  reviewScope,
  onReviewScope,
  sortBy,
  onSortBy,
  onReset,
  canReset = true,
  isAuthenticated,
  onRequireLogin,
}: FiltersBarProps) {
  const handleStars = (v: string) => onMinStars(v as StarsValue);
  const handleSort = (v: string) => onSortBy(v as SortKey);
  const handleScope = (v: string) => onReviewScope(v as ReviewScope);
  return (
    <div className={styles.root}>
      <div className={styles.group}>
        <span className={styles.label}>Rating</span>
        <Select value={minStars} onValueChange={handleStars}>
          <SelectTrigger className={styles.triggerRating}>
            <SelectValue placeholder="Any" />
          </SelectTrigger>
          <SelectContent>
            {makeRatingOptions(DEFAULT_LABELS_EN).map(o => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className={styles.group}>
        <span className={styles.label}>Sort</span>
        <Select value={sortBy} onValueChange={handleSort}>
          <SelectTrigger className={styles.triggerWide}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {makeSortOptions(DEFAULT_LABELS_EN).map(o => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className={styles.group}>
        <span className={styles.label}>Reviews</span>
        <Select
          value={reviewScope}
          onValueChange={(v) => {
            if (((v as ReviewScope) === "mine" || (v as ReviewScope) === "not_mine") && !isAuthenticated) {
              onRequireLogin();
              return;
            }
            handleScope(v);
          }}
        >
          <SelectTrigger className={styles.triggerWide}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {makeReviewScopeOptions(DEFAULT_LABELS_EN).map(o => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button variant="outline" size="sm" onClick={onReset} disabled={!canReset}>
        Clear filters
      </Button>
      <SearchBar value={searchQuery} onSearch={onSearch} />
    </div>
  );
}
