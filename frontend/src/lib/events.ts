export type AppEventName = "movie:changed" | "reviews:changed" | "media:changed" | "user:changed";
type AppEventDetail = Record<string, unknown>;

export function emitAppEvent(name: AppEventName, detail: AppEventDetail = {}): void {
  window.dispatchEvent(new CustomEvent(`app:${name}`, { detail }));
}

export function onAppEvent<T extends AppEventDetail>(
  name: AppEventName,
  handler: (detail: T) => void
): () => void {
  const listener = (e: Event) => {
    const ce = e as CustomEvent<T>;
    handler(ce.detail as T);
  };
  window.addEventListener(`app:${name}`, listener as EventListener);
  return () => window.removeEventListener(`app:${name}`, listener as EventListener);
}
