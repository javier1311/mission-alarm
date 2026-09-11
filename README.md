# Mission Alarm

Будильник с миссиями (штрихкод, фитнес, фото на улице, математика) для iOS и Android.
Стек: Expo SDK 57 · React Native · TypeScript · expo-router · zustand · i18next.

## Запуск на Android (Expo Go)

1. На телефоне установите **Expo Go** из Google Play.
2. Телефон и ПК — в одной Wi-Fi сети.
3. На ПК:
   ```bash
   npm install
   npm start
   ```
4. Отсканируйте QR-код из терминала в Expo Go.

Предпросмотр в браузере: `npm run web`.

## Запуск на iPhone (без Mac и без платного аккаунта)

Expo Go для iOS больше нет в App Store, поэтому iOS-сборка делается в облаке:

1. Запушьте репозиторий на GitHub — workflow `.github/workflows/ios-build.yml` соберёт
   неподписанный `.ipa` (Actions → iOS build → Run workflow → `dev` или `release`).
2. Скачайте артефакт `MissionAlarm-dev-ipa`.
3. На Windows установите [Sideloadly](https://sideloadly.io) и Apple Devices (или iTunes).
   Подпишите и установите `.ipa` бесплатным Apple ID (действует 7 дней, потом переустановить).
4. На iPhone: Настройки → Конфиденциальность → Developer Mode → включить.
5. Вариант `dev`: откройте приложение, на ПК запустите `npm run start:dev-client`,
   введите адрес Metro (или отсканируйте QR) — дальше код обновляется по Wi-Fi.
   Вариант `release`: автономное приложение с бандлом внутри.

## Структура

```
app/                 экраны (expo-router)
  index.tsx          список будильников
  alarm/[id].tsx     редактор будильника
  alarm/sound.tsx    выбор звука (+ свои файлы)
  alarm/wallpaper.tsx выбор обоев (+ свои картинки)
  alarm/mission.tsx  настройка миссии
  alarm/unlock.tsx   правило разблокировки приложений после будильника
  ring/[id].tsx      экран звонка + миссии
  settings.tsx       тема, язык
src/
  alarm/             планировщик (уведомления), тикер, state-machine звонка
  audio/             плеер будильника (loop, mute/unmute, вибрация)
  missions/          реестр миссий, экраны выполнения, счётчик повторений
  store/             zustand-хранилище (persist) + черновик редактора
  i18n/locales/      ru, en, tk, tr — новый язык = новый файл + строка в LANGUAGES
  data/              реестры звуков и обоев
assets/sounds/       30 звуков (Mixkit, бесплатная лицензия)
assets/wallpapers/   16 обоев
```

## Логика звонка

```
звонит → «Сделать миссию» (тратит 1 нажатие «тишина») → тишина N секунд
  миссия не начата за N секунд → звук возвращается, миссия остаётся открытой
  прогресс (повторение, верный ответ, скан) → снова тишина на окно миссии
     фитнес: пауза > 3 с → звук возвращается
  миссия выполнена → следующая (новое окно) или будильник выключен
```

## Дорожная карта

- [x] Фаза 1 — UI, будильники, звуки, обои, миссии: математика, штрихкод, фото
- [x] Фаза 2 — нативный будильник Android (`modules/alarm-native`: AlarmManager, full-screen intent, после перезагрузки) + блокировка приложений (`modules/app-blocker`: UsageStats + foreground service)
- [x] Фаза 3 — фитнес-миссия: `modules/pose-camera` (CameraX/AVFoundation + ML Kit Pose), счётчик повторений в `src/missions/fitness`
- [x] Фаза 4 — iOS AlarmKit (iOS 26+): `plugins/withAlarmKit.js` + `plugins/ios/AlarmKitBridge.swift`
- [x] Фаза 5 — пост-блокировка: до времени / доп. миссия / геолокация (`app/locked.tsx`)
- [ ] iOS блокировка приложений (Screen Time API — нужен платный Apple Developer)
- [ ] Свои звуки в системном будильнике iOS (AlarmKit `.named` — нужно копировать файлы в bundle)

## Локальная Android-сборка (Windows)

JDK 17 и Android SDK лежат в `D:/Claude/tools` (без Android Studio). Эмулятор `test36` (Android 16).
```
npx expo prebuild --platform android
cd android && gradlew.bat :app:assembleDebug
```
Нативные модули лежат в `modules/` (Expo Modules API, автолинк). После изменения Kotlin/Swift нужна пересборка.
