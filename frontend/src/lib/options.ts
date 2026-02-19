export type StarsValue = "0" | "1" | "2" | "3" | "4" | "5";
export type ReviewScope = "all" | "mine" | "not_mine";
export type SortKey = "rank_asc" | "reviews_desc" | "rating_desc" | "release_desc" | "release_asc" | "uploaded_desc";

export type Labels = {
  rating_any: string;
  rating_5: string;
  rating_4: string;
  rating_3: string;
  rating_2: string;
  rating_1: string;
  review_all: string;
  review_mine: string;
  review_not_mine: string;
  sort_reviews: string;
  sort_rank: string;
  sort_rating: string;
  sort_release_new: string;
  sort_release_old: string;
  sort_uploaded: string;
};

export const DEFAULT_LABELS_EN: Labels = {
  rating_any: "Any",
  rating_5: "5 stars",
  rating_4: "4+ stars",
  rating_3: "3+ stars",
  rating_2: "2+ stars",
  rating_1: "1+ stars",
  review_all: "All",
  review_mine: "Reviewed by me",
  review_not_mine: "Not reviewed by me",
  sort_reviews: "Most reviews",
  sort_rank: "Top ranked",
  sort_rating: "Highest rated",
  sort_release_new: "Newest release",
  sort_release_old: "Oldest release",
  sort_uploaded: "Recently added",
};

export const makeRatingOptions = (l: Labels) => ([
  { value: "0" as StarsValue, label: l.rating_any },
  { value: "5" as StarsValue, label: l.rating_5 },
  { value: "4" as StarsValue, label: l.rating_4 },
  { value: "3" as StarsValue, label: l.rating_3 },
  { value: "2" as StarsValue, label: l.rating_2 },
  { value: "1" as StarsValue, label: l.rating_1 },
]);

export const makeReviewScopeOptions = (l: Labels) => ([
  { value: "all" as ReviewScope, label: l.review_all },
  { value: "mine" as ReviewScope, label: l.review_mine },
  { value: "not_mine" as ReviewScope, label: l.review_not_mine },
]);

export const makeSortOptions = (l: Labels) => ([
  { value: "rank_asc" as SortKey, label: l.sort_rank },
  { value: "reviews_desc" as SortKey, label: l.sort_reviews },
  { value: "rating_desc" as SortKey, label: l.sort_rating },
  { value: "release_desc" as SortKey, label: l.sort_release_new },
  { value: "release_asc" as SortKey, label: l.sort_release_old },
  { value: "uploaded_desc" as SortKey, label: l.sort_uploaded },
]);
