# Mission Alarm — notes for agents

- Expo SDK 57 (React Native 0.86, React 19). Check versioned docs at https://docs.expo.dev/versions/v57.0.0/ — APIs differ from older SDKs (expo-audio instead of expo-av, new expo-file-system File/Directory API).
- Path alias `@/*` → `src/*`. Screens live in `app/` (expo-router).
- All user-facing strings go through i18n: add keys to every file in `src/i18n/locales/` (`Translation` type enforces parity).
- Mission timing rules are product decisions — see README "Логика звонка"; keep `useRingSession` behaviour in sync.
- Bundled sounds are Mixkit (free license). Do not add copyrighted audio.
- Typecheck: `npm run typecheck`. Web smoke test: `npm run export:web`.
