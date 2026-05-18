// One-time seeding helper used by the new localStorage stat keys
// (flashcardStats, verbInfinitiveStats) that replaced the legacy server
// endpoints. Hydrates the localStorage map from existing JSON `correct` /
// `incorrect` fields so historical counts aren't lost on first load.
export function seedStatsOnce(storageKey, items, buildRecord) {
  if (typeof window === 'undefined') return;
  if (window.localStorage.getItem(storageKey) !== null) return;

  const seeded = {};
  for (const item of items) {
    const record = buildRecord(item);
    if (record) seeded[record.key] = record.value;
  }
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(seeded));
  } catch {
    // localStorage disabled — seeding is best-effort
  }
}
