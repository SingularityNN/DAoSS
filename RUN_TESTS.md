# Запуск интеграционных тестов через командную строку

## Предварительные требования

Убедитесь, что вы находитесь в корневой директории проекта `DAoSS`:

```cmd
cd C:\Users\user\DAoSS
```

## Команды для запуска тестов

### 1. Запуск всех тестов в watch режиме

```cmd
npm test
```

Тесты будут запускаться автоматически при изменении файлов.

### 2. Запуск всех тестов один раз

```cmd
npm run test:run
```

### 3. Запуск тестов с подробным выводом

```cmd
npm run test:run -- --reporter=verbose
```

### 4. Запуск конкретного файла тестов

```cmd
npm run test:run -- src/test/integration/App.integration.test.tsx
```

### 5. Запуск тестов с фильтром по названию

```cmd
npm run test:run -- -t "Authentication"
```

Это запустит только тесты, содержащие "Authentication" в названии.

### 6. Запуск тестов с UI (требует браузер)

```cmd
npm run test:ui
```

Откроется веб-интерфейс для просмотра результатов тестов.

## Пример полного вывода

После выполнения команды вы увидите что-то вроде:

```
 ✓ src/test/integration/App.integration.test.tsx (15)
   ✓ App Integration Tests (15)
     ✓ Authentication Flow (5)
       ✓ should redirect authenticated user from home to projects
       ✓ should show login page for unauthenticated user
       ...
     ✓ Navigation Flow (5)
     ✓ Projects Flow (3)
     ✓ Invitations Flow (2)

 ✓ src/test/integration/Projects.integration.test.tsx (6)
 ✓ src/test/integration/ProjectDetails.integration.test.tsx (4)
 ✓ src/test/integration/Auth.integration.test.tsx (5)
 ✓ src/test/integration/Invitations.integration.test.tsx (5)

Test Files  5 passed (5)
     Tests  35 passed (35)
```

## Устранение проблем

### Если тесты не запускаются:

1. Убедитесь, что зависимости установлены:
```cmd
npm install
```

2. Проверьте, что вы в правильной директории:
```cmd
cd C:\Users\user\DAoSS
```

3. Проверьте версию Node.js (должна быть установлена):
```cmd
node --version
```

### Если возникают ошибки импорта:

Убедитесь, что все файлы на месте:
- `src/test/setup.ts`
- `src/test/mocks/api.ts`
- `src/test/utils/test-utils.tsx`
- `vite.config.ts` (с настройками тестов)

## Быстрый старт

Самый простой способ запустить все тесты:

```cmd
cd C:\Users\user\DAoSS
npm run test:run
```

