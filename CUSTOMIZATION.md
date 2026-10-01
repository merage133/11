# 🎨 Кастомизация установщика

## Картинки для мастера установки

### Требования к картинкам

#### WizardImageFile (большое изображение слева)
- **Размер:** 164 x 314 пикселей
- **Формат:** BMP (24-bit или 32-bit)
- **Расположение:** Левая сторона мастера установки
- **Видно на:** Welcome, License, Select Destination, и других страницах

#### WizardSmallImageFile (маленькое изображение вверху)
- **Размер:** 55 x 58 пикселей
- **Формат:** BMP (24-bit или 32-bit)
- **Расположение:** Верхний правый угол мастера
- **Видно на:** Всех страницах мастера

### Как создать картинки

#### Вариант 1: Photoshop / GIMP

1. Создайте новое изображение с указанными размерами
2. Добавьте логотип и текст
3. Сохраните как BMP (24-bit)

#### Вариант 2: Онлайн-инструменты

- **Canva** — https://canva.com
- **Figma** — https://figma.com
- **Photopea** — https://photopea.com (бесплатный Photoshop онлайн)

#### Вариант 3: Генерация через AI

Используйте Midjourney, DALL-E или Stable Diffusion:

**Промпт для WizardImage:**
```
Modern software installer wizard image, 164x314 pixels, dark theme, 
AI assistant concept, neural network visualization, blue and purple gradient, 
professional look, minimalist design
```

**Промпт для WizardSmallImage:**
```
Software logo icon, 55x58 pixels, AI robot head, blue and purple colors, 
simple design, dark background, professional
```

### Пример структуры папки

```
ru-ai-studio/
├── images/
│   ├── wizard_image.bmp      (164x314)
│   ├── wizard_small.bmp      (55x58)
│   └── app.ico               (256x256, multi-size)
├── setup.iss
└── ...
```

### Подключение картинок в setup.iss

Откройте `setup.iss` и раскомментируйте строки:

```pascal
[Setup]
; Раскомментируйте и укажите пути:
WizardImageFile=images\wizard_image.bmp
WizardSmallImageFile=images\wizard_small.bmp
SetupIconFile=images\app.ico
UninstallDisplayIcon={app}\dist\assets\app.ico
```

## Иконка приложения

### Требования к иконке

- **Размер:** 256 x 256 пикселей
- **Формат:** ICO (multi-size: 16x16, 32x32, 48x48, 256x256)
- **Глубина цвета:** 32-bit (с прозрачностью)

### Как создать иконку

#### Вариант 1: Онлайн-конвертеры

1. Создайте PNG 256x256
2. Конвертируйте в ICO:
   - https://convertio.co/png-ico/
   - https://icoconvert.com/
   - https://www.favicon-generator.org/

#### Вариант 2: IcoFX

Скачайте IcoFX (платная программа, но есть trial):
- https://icofx.ro/

#### Вариант 3: GIMP

1. Откройте PNG в GIMP
2. File → Export As
3. Выберите формат .ico
4. В настройках выберите все размеры (16, 32, 48, 256)

### Подключение иконки в setup.iss

```pascal
[Setup]
SetupIconFile=images\app.ico
UninstallDisplayIcon={app}\dist\assets\app.ico

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; IconFilename: "{app}\dist\assets\app.ico"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; IconFilename: "{app}\dist\assets\app.ico"; Tasks: desktopicon
```

## Цветовая схема

### Рекомендуемые цвета для RU AI Studio

```
Основной фон: #0d1117 (тёмный)
Акцент: #58a6ff (голубой)
Вторичный: #bc8cff (фиолетовый)
Текст: #e6edf3 (светлый)
Успех: #3fb950 (зелёный)
Ошибка: #f85149 (красный)
```

### Градиент для фона

```
От: #58a6ff (голубой)
До: #bc8cff (фиолетовый)
Угол: 135°
```

## Текст на картинках

### WizardImage (большое изображение)

**Рекомендуемый текст:**
```
RU AI Studio

Локальный AI-ассистент
с полным доступом к компьютеру

v1.0.0
```

**Шрифт:** Segoe UI, Roboto, или Arial
**Размер:** 18-24 pt для заголовка, 12-14 pt для описания
**Цвет:** Белый с тенью

### WizardSmallImage (маленькое изображение)

**Рекомендуемый текст:**
```
RU AI
```

Или просто логотип без текста.

## Примеры дизайна

### Минималистичный

- Тёмный фон (#0d1117)
- Белый текст
- Голубой акцент (#58a6ff)
- Простой логотип

### Современный

- Градиент от голубого к фиолетовому
- Белый текст
- Иконка нейросети
- Минималистичный дизайн

### Профессиональный

- Тёмно-синий фон
- Белый текст
- Логотип с градиентом
- Версия и год

## Инструменты для создания графики

### Бесплатные

- **GIMP** — https://www.gimp.org/ (растровый редактор)
- **Inkscape** — https://inkscape.org/ (векторный редактор)
- **Figma** — https://figma.com (онлайн-дизайн)
- **Canva** — https://canva.com (онлайн-дизайн)

### Платные

- **Adobe Photoshop** — растровый редактор
- **Adobe Illustrator** — векторный редактор
- **IcoFX** — создание иконок
- **Axure RP** — прототипирование

### AI-генерация

- **Midjourney** — https://midjourney.com/
- **DALL-E** — https://openai.com/dall-e-3
- **Stable Diffusion** — https://stability.ai/
- **Leonardo AI** — https://leonardo.ai/

## Проверка перед компиляцией

### Чек-лист

- [ ] Картинки имеют правильный размер
- [ ] Картинки сохранены в формате BMP
- [ ] Иконка сохранена в формате ICO
- [ ] Пути в setup.iss указаны правильно
- [ ] Файлы находятся в указанных папках
- [ ] Цветовая схема соответствует бренду

### Тестирование

1. Закомментируйте строки с картинками
2. Скомпилируйте установщик
3. Проверьте что всё работает
4. Раскомментируйте строки с картинками
5. Скомпилируйте снова
6. Проверьте что картинки отображаются

## Полезные советы

1. **Используйте PNG для создания, затем конвертируйте в BMP**
2. **Сохраняйте исходники** (PSD, XCF, FIG)
3. **Тестируйте на разных разрешениях экрана**
4. **Проверяйте читаемость текста на разных фонах**
5. **Используйте контрастные цвета**

---

**Версия:** 1.0  
**Обновлено:** 2024
