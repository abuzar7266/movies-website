import SearchBar from "../SearchBar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { DEFAULT_LABELS_EN, makeRatingOptions, makeReviewScopeOptions, makeSortOptions } from "../../lib/options";
import type { ReviewScope, StarsValue, SortKey } from "../../lib/options";

interface FiltersBarProps {
  searchQuery: string;
  onSearch: (q: string) => void;
  minStars: "0" | "1" | "2" | "3" | "4" | "5";
  onMinStars: (v: FiltersBarProps["minStars"]) => void;
  reviewScope: "all" | "mine" | "not_mine";
  onReviewScope: (v: FiltersBarProps["reviewScope"]) => void;
  sortBy: SortKey;
  onSortBy: (v: FiltersBarProps["sortBy"]) => void;
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
  isAuthenticated,
  onRequireLogin,
}: FiltersBarProps) {
  const handleStars = (v: string) => onMinStars(v as StarsValue);
  const handleSort = (v: string) => onSortBy(v as SortKey);
  const handleScope = (v: string) => onReviewScope(v as ReviewScope);
  return (
    <div className="flex w-full flex-col-reverse gap-3 sm:w-auto sm:flex-row sm:items-center">
      <div className="flex items-center gap-2">
        <span className="text-sm text-[hsl(var(--muted-foreground))]">Rating</span>
        <Select value={minStars} onValueChange={handleStars}>
          <SelectTrigger className="w-[110px]">
            <SelectValue placeholder="Any" />
          </SelectTrigger>
          <SelectContent>
            {makeRatingOptions(DEFAULT_LABELS_EN).map(o => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-[hsl(var(--muted-foreground))]">Sort</span>
        <Select value={sortBy} onValueChange={handleSort}>
          <SelectTrigger className="w-[170px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {makeSortOptions(DEFAULT_LABELS_EN).map(o => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-[hsl(var(--muted-foreground))]">Reviews</span>
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
          <SelectTrigger className="w-[170px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {makeReviewScopeOptions(DEFAULT_LABELS_EN).map(o => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <SearchBar onSearch={onSearch} initialValue={searchQuery} />
    </div>
  );
}
