<div align="center">

<img src="public/screenshots/hako.jpg" alt="Hako — today's box" width="900" />

**[ English ]** · **[ Русский ↓ ](#hako--箱--русская-версия)**

`Next.js 14` · `TypeScript` · `Supabase` · `Stripe` · `Gemini 2.5 Flash` · `Tailwind` · `Vitest`

`11.5k LOC` · `10 test suites` · `6 solving techniques` · `12 achievements` · `365 daily kanji`

</div>

---

> *"A new sudoku every day. Twelve to twenty minutes, no rush.*
> *The seal prints when you finish — not before."*
> &nbsp; — the product, on itself

## The thirty‑second pitch

Hako (箱 — "box") is a daily sudoku for people who don't want their puzzle app to feel like a slot machine. One puzzle a day, the same for everyone, unlocked at 00:00 in your timezone. No streak‑saver pop‑ups. No level‑up chimes. No confetti. When you finish, a vermillion **完** ("complete") seal stamps off‑axis on the board and your time is *written, not flashed*.

The technical brief asked for an MVP sudoku. What's in this repo is a full‑bodied take on **what daily sudoku could be if the design language did real work.**

|                  |                                                                                                  |
| :--------------- | :----------------------------------------------------------------------------------------------- |
| **What**         | a daily sudoku that feels like a newspaper, not a casino                                         |
| **For**          | the daily‑puzzle audience NYT Games and Wordle proved is real — sudoku is the conspicuous gap    |
| **Differentiator** | a coach that refuses to spoil · a streak you can actually lose · a year of kanji to fill in   |
| **Free**         | the daily, the coach (20 calls/day), the seasonal skin, the leaderboard                          |
| **Pro** ($4/mo)  | unlimited coach · Expert tier + full archive · every skin                                        |
| **Built with**   | Next.js 14 · Supabase · Stripe · Gemini 2.5 Flash · Tailwind · `@vercel/og`                      |

---

## Table of contents

1. [Why this exists](#why-this-exists)
2. [Why this could be a real service](#why-this-could-be-a-real-service)
3. [The product surface](#the-product-surface)
4. [Engineering highlights](#engineering-highlights)
5. [Going beyond the brief](#going-beyond-the-brief)
6. [Tech stack](#tech-stack)
7. [Run it locally](#run-it-locally)
8. [Project map](#project-map)
9. [Quality bar](#quality-bar)
10. [Roadmap](#roadmap)
11. [Русская версия ↓](#hako--箱--русская-версия)

---

## Why this exists

Most puzzle apps optimize for time‑on‑device. Hako optimizes for **the feeling of a finished day.**

- A streak you can lose. → No grace pop‑up. Miss a day, it resets. Honest.
- A coach that won't spoil it. → Sensei has two modes. The cheaper one *can't* name the cell.
- A grid shared by the world. → Same daily puzzle for everyone, so rank means something.
- A reason to come back tomorrow. → A new kanji, a one‑line reading, a square that fills on the year scroll.

The principle section on the landing names it directly: **静 Quiet · 日 Daily · 完 Finished.**

> *"The mark is earned, not chased."* — landing copy

---

## Why this could be a real service

> *"Главная цель — не просто сделать сайт для игры, а показать, что вы можете создать продукт, который потенциально может стать настоящим сервисом."* — nFactorial

This is the answer to that.

**The market is real.** Daily‑puzzle apps are now a proven subscription category. NYT Games has built a multi‑million‑subscriber business around Mini Crossword, Wordle, and Connections — all of them *one puzzle, twelve minutes, shared by everyone, every day*. Sudoku at that polish level is the conspicuous gap.

**The monetization is wired up, not planned.**
- **Pro · $4 / month** — Stripe subscription, live in [`lib/stripe`](lib/stripe). Targets the natural 3–8% of free users who upgrade for unlimited coach + Expert + skins.
- **One‑time skin SKUs** — Stripe one‑time payments, live. Sumi‑e at $1 is a low‑friction emotional buy that doesn't ask for commitment.
- **Streak freezes** (planned, data model exists) — a Duolingo‑validated micro‑purchase that monetizes loss aversion the product otherwise refuses to weaponize.

**Retention is structural, not bolted on.** Four nested return triggers — daily ritual → streak → daily kanji + year scroll → achievements. Each layer compounds. Miss a day and you lose the streak, but the year scroll still fills — so the worst‑case lapsed user still has a partial record pulling them back.

**Acquisition is built into the win moment.** Every solved daily server‑renders an OG share card (kanji + time + streak baked into a 1080×1080 PNG via `@vercel/og`). Designed to drop into Telegram / Twitter / Instagram unmodified — each finished puzzle is a recruitment asset, no separate "share" feature required.

**Unit economics work.** Gemini 2.5 Flash is roughly $0.0003 per coach call. The 20‑call/day free quota caps a worst‑case free user at about $0.18/month in AI cost. A single $4 Pro subscription covers thousands of coach calls. Infra cost ceiling sits well under any reasonable LTV floor.

**The moat is the combination, not any one piece.** Anyone can build a sudoku. The defensible parts are (a) a *single shared daily puzzle*, (b) a coach that *genuinely refuses to spoil*, and (c) a *coherent design language* people post about. Each one alone is hard; together they're a product personality that doesn't fall out of a feature checklist.

---

## The product surface

### The daily

- A single puzzle, the same for everyone, unlocked at midnight local time and open for thirty hours.
- Always **Hard**. (Casual mode is right there if you want more.)
- A live counter on the home page: *N solving today · M in your city · first solve at HH:MM.*

### Four difficulties

| Glyph | Tier   | Givens | Target |
| :---: | :----- | :----: | :----: |
| 易    | Easy   | 38     | ~4:12  |
| 中    | Medium | 30     | ~8:30  |
| 難    | Hard   | 26     | ~14:50 |
| 極    | Expert | 22     | 23:00+ |

The generator guarantees a **unique** solution. The solver is full enough to detect six classical techniques used to rank hint quality — see [Engineering highlights](#engineering-highlights).

### Sensei · the coach (not a chatbot)

A two‑mode AI hint system on **Gemini 2.5 Flash**.

| Mode  | What it gives you                                            | What it never gives you |
| ----- | ------------------------------------------------------------ | :---------------------- |
| nudge | the technique + the unit ("naked pair in row 6")             | the cell, the digit     |
| ask   | the cell + the digit ("R6C8 is 7") + one sentence of reasoning | the rest of the solve |

The `nudge` system prompt is hand‑written to refuse the cell and digit even under adversarial follow‑ups. Free tier: 20 calls/day. Pro: unlimited.

### The seal calendar · 365 kanji a year

Each day has its own kanji from the curated bank (`月` moon, `火` fire, `水` water, `木` tree, `山` mountain…), plus a one‑sentence **Sensei reading** — generated by Gemini with a locked prompt:

> *"8–14 words, present tense, reference kanji imagery, spare and grounded, no emoji or exclamations."*

The **Year Scroll** renders the full 365‑day grid in five states:

```
█  filled        ▒  today        □  empty
▓  freeze        ·  future
```

It scrolls. It fills in. Missing days are visible, not papered over.

### Twelve marks · achievements

Kanji as badges. Two stay hidden until earned.

| Glyph | Name                | Earned by |
| :---: | :------------------ | :-------- |
| 連    | Seven days          | 7‑day streak |
| 月    | A month, kept       | 30‑day streak |
| 百    | A hundred days      | 100‑day streak |
| 速    | Under three         | Easy in < 3:00 |
| 鋭    | Sharp on Hard       | Hard in < 10:00 |
| 神    | Divine on Expert    | Expert in < 25:00 |
| 初    | First in            | First daily submit globally |
| 暁    | Before dawn         | Solve before 06:00 local |
| ?     | *hidden*            | *— four marks discovered by playing* |

### Pro · "three things, nothing else"

$4 / month. The Pro page makes the promise explicit:

1. **先 · Unlimited coach** — no daily cap.
2. **極 · Expert + archive** — every past daily, opened.
3. **完 · Every skin** — the full library while you're a member.

### Skins · seasonal, premium, earned

Cosmetic palette swaps that also change the seal kanji and masthead copy.

- **Seasonal** — spring `桜`, summer `蓮`, autumn `楓`, winter `雪`. Free in‑season, archived for Pro.
- **Premium** — Sumi‑e `墨`, Indigo `藍`. One‑time SKU or included in Pro.
- **Challenge‑locked** — Matsuri `祭` (7‑day streak), Koi `鯉` (30 solves), Yūrei `幽` (solve at 3 a.m.). Free once earned.

### The shared ledger

- **Leaderboard** — filterable by date, city, range (today / 7d / all).
- **City rank** — surfaced on the home page if your time lands in your city's top tier.
- **OG share cards** — edge‑rendered 1080×1080 PNGs via `@vercel/og`, so a finished daily can be posted with the kanji, time, and streak baked into the image.

---

## Engineering highlights

Four things in this repo that took real thought:

### 1 · A solver that *grades* hints, not just finds them

[`lib/sudoku/techniques.ts`](lib/sudoku/techniques.ts) implements six classical solving techniques, returned in a strict order of complexity:

```
naked-single  →  hidden-single  →  locked-candidate
   →  naked-pair  →  hidden-pair  →  x-wing
```

Each hint carries `{ index, value, technique, unit, cells, reason }` so the UI can both highlight the cell *and* explain *why* in the language of solving ("only R6C8 can hold 7"). That's what lets the coach speak like a teacher rather than an answer key.

### 2 · A coach prompt engineered to refuse

The hard part of `nudge` mode isn't calling Gemini — it's writing a system prompt that holds the line. The prompt:

- declares the technique and unit explicitly
- forbids naming a specific cell or digit
- forbids "I can't tell you, but it's R6C8" — the model rejects partial reveals too

See [`lib/coach/prompt.ts`](lib/coach/prompt.ts). Quota is tracked per‑user per‑day in Postgres so a single bad actor can't burn the bill.

### 3 · A puzzle generator with a verifier in CI

`scripts/verify-generator.ts` (run via `npm run verify-generator`) generates a batch of puzzles and runs each one through the solver to assert a *unique* solution. New seeds never ship without passing.

### 4 · A skin system that's data, not code

Skins live in Postgres ([`lib/skins/registry.ts`](lib/skins/registry.ts)) with five categories of "how to obtain" — `wearing`, `wear`, `wear-included`, `buy`, `in-print`, `back-issue`, `future`, `locked-challenge`, `hidden` — and a single catalog resolver ([`lib/skins/catalog.ts`](lib/skins/catalog.ts)) maps `(skin, viewer, today) → action`. Adding a skin means inserting a row, not deploying.

---

## Going beyond the brief

> *"Не обязательно делать всё 100% как в техническом задании. Покажите свою креативность, расскажите нам об этом в README.md ❤"* — nFactorial

Three places we leaned into the permission:

**1 · A real design language.** Mincho serif typography, vermillion `朱` accent, sumi `墨` ink, bone `骨` paper. The masthead reads like a newspaper. The **完** seal is rotated off‑axis on win because nothing hand‑stamped lines up straight. The brand has its own [VermillionStamp component](components/landing/VermillionStamp.tsx).

**2 · Ritual, not game.** The seal calendar, the per‑day kanji + reading, the year scroll, the absence of streak‑saver upsell. These aren't extra features — they're the **shape** of the product. They turn it from a thing you play into a thing you *do*.

**3 · A coach with taste.** Most LLM hint systems either (a) hold back so much they're useless or (b) blurt the answer the first time you press hard. Two clearly‑bounded modes — and a system prompt that refuses to reveal in `nudge` even under pressure — is genuinely subtle prompt design.

---

## Tech stack

| Layer            | Choice |
| :--------------- | :----- |
| App framework    | Next.js 14 (App Router), React 18, TypeScript 5.7 |
| Game state       | Zustand |
| Styling          | Tailwind CSS + CSS variables for skin palettes |
| Motion           | Framer Motion (sparingly — the design rewards stillness) |
| Auth + database  | Supabase (Postgres + Row‑Level Security) |
| Payments         | Stripe (recurring subscription + one‑time skin SKUs) |
| AI               | Google Gemini 2.5 Flash (`@google/genai`) |
| OG images        | `@vercel/og` (edge runtime, 1080×1080) |
| UI primitives    | Radix (dialog · dropdown · toast) |
| Telemetry        | `@vercel/speed-insights` |
| Testing          | Vitest + React Testing Library + jsdom |

---

## Run it locally

```bash
git clone <repo>
cd sudoku
npm install
cp .env.example .env.local        # SUPABASE_* · STRIPE_* · GOOGLE_API_KEY
npm run dev                       # → http://localhost:3000
```

Useful scripts:

```bash
npm run typecheck                 # tsc --noEmit, strict
npm run lint                      # next lint
npm test                          # vitest run
npm run verify-generator          # batch-check puzzle uniqueness
npm run seed                      # seed daily puzzles
npm run seed-seal                 # seed the year-of-kanji calendar
npm run seed-skins                # seed the skin catalog
npm run generate-sfx              # regenerate solve-thunk / solve-tone SFX
```

---

## Project map

```
app/                    Next.js App Router routes
  api/                  coach · daily · seal · share · stripe webhooks
  play/[difficulty]/    the board page
  pro/                  paywall
  leaderboard/          shared ledger
  year/                 the 365-day scroll
  achievements/         twelve marks
  skins/                catalog
  profile/              account + city picker
  auth/                 supabase auth handoff

components/
  game/                 Board · Cell · NumberPad · CoachPopover · WinModal · Timer
  landing/              signed-out marketing surface
  year-scroll/          calendar + per-day seal popover
  skins/                skin chip + previews
  stats/                leaderboard rows + city counts
  ui/                   shadcn primitives (button, dialog, toast)

lib/
  sudoku/               generator · solver · 6 techniques · uniqueness checker
  coach/                Gemini prompts + per-user daily quotas
  seal/                 calendar · streak · freeze · Sensei voice
  skins/                catalog · registry · entitlements · viewer resolution
  stats/                leaderboard math + rank computation
  achievements.ts       12 marks, 4 hidden
  stripe/               checkout sessions + webhook handlers
  supabase/             server + browser client factories
  kanji.ts              date formatting in kanji
  kanji-bank.ts         curated bank of daily kanji

scripts/                seed + verify CLIs
tests/                  vitest suites (skins, sfx, seal/streak, seal/calendar, …)
supabase/               migrations
```

---

## Quality bar

- **TypeScript strict** mode, no `any` in the hint engine or the coach quota logic.
- **Vitest** suites cover the parts that absolutely cannot regress: skin entitlement resolution (free / Pro / challenge / season), streak computation across freeze edges, calendar state derivation, SFX server caching.
- **Generator verifier** in `scripts/verify-generator.ts` is the gate against shipping a non‑unique puzzle.
- **Row‑Level Security** policies live in `supabase/migrations` — the client never trusts its own claim of who it is.
- **Coach quota** is enforced server‑side in Postgres, not just client‑rate‑limited.

---

## Roadmap

Honest list of what isn't here yet:

- [ ] Mobile‑first PWA install (currently responsive, not installable)
- [ ] Push notification at 00:00 local when the daily unlocks
- [ ] Replay mode — step through your own solve afterward
- [ ] "Two‑player race" mode for the daily (same grid, side‑by‑side)
- [ ] Auto‑grant of challenge skins on the qualifying event (the catalog hint is wired; the trigger isn't)
- [ ] Streak‑freeze purchase UI (the data model exists; the buy flow doesn't)
- [ ] OG cards for streak milestones (currently only per‑daily)

---

<div align="center">

— *open the box.* —

</div>

---

<div align="center">

# Hako · 箱 · Русская версия

**тихая судоку, печатается ежедневно**

</div>

---

> *«Новая судоку каждый день. От двенадцати до двадцати минут, без спешки.*
> *Печать ставится, когда ты заканчиваешь — не раньше.»*
> &nbsp; — продукт, о себе

## Питч на тридцать секунд

Hako (箱 — «коробка», «ящик») — ежедневная судоку для тех, кому не нравится, что приложения‑головоломки устроены как игровые автоматы. Одна задача в день, одна и та же для всех, открывается в 00:00 по вашему часовому поясу. Никаких «спаси свой стрик за 99¢». Никаких звуков level‑up. Никакого конфетти. Когда вы заканчиваете — киноварная печать **完** («завершено») ставится с лёгким наклоном на доску, а время *записывается, а не вспыхивает*.

В техзадании просили MVP. Здесь — попытка ответить на вопрос **«какой могла бы быть ежедневная судоку, если бы дизайн действительно делал работу».**

|                  |                                                                                            |
| :--------------- | :----------------------------------------------------------------------------------------- |
| **Что**          | ежедневная судоку с ощущением газеты, а не казино                                          |
| **Для кого**     | аудитория ежедневных головоломок — та, которую сделали реальной NYT Games и Wordle         |
| **Отличие**      | подсказчик, который не сольёт · стрик, который можно реально потерять · год иероглифов     |
| **Бесплатно**    | дневная задача · подсказчик (20 раз/день) · сезонный скин · таблица лидеров                |
| **Pro** ($4/мес) | безлимитный подсказчик · уровень Expert + весь архив · все скины                           |
| **На чём**       | Next.js 14 · Supabase · Stripe · Gemini 2.5 Flash · Tailwind · `@vercel/og`                |

---

## Содержание

1. [Зачем это](#зачем-это)
2. [Почему это может стать настоящим сервисом](#почему-это-может-стать-настоящим-сервисом)
3. [Продуктовая поверхность](#продуктовая-поверхность)
4. [Инженерные акценты](#инженерные-акценты)
5. [Поверх ТЗ](#поверх-тз)
6. [Стек](#стек)
7. [Запуск](#запуск)
8. [Карта проекта](#карта-проекта)
9. [Планка качества](#планка-качества)
10. [Дальше](#дальше)

---

## Зачем это

Большинство приложений‑головоломок оптимизируют время в приложении. Hako оптимизирует **ощущение завершённого дня.**

- Стрик, который можно потерять. → Никакого попапа‑спасения. Пропустил день — обнулилось. Честно.
- Подсказчик, который не сольёт. → У Sensei два режима. Дешёвый *не может* назвать клетку.
- Сетка, общая для мира. → Одна и та же дневная задача — поэтому ранг что‑то значит.
- Повод вернуться завтра. → Новый иероглиф, одна строка прочтения, клетка на свитке года.

Принципы на лендинге называют это прямо: **静 Тихо · 日 Каждый день · 完 Завершено.**

> *«Знак заслужен, а не пойман».* — текст лендинга

---

## Почему это может стать настоящим сервисом

> *«Главная цель — не просто сделать сайт для игры, а показать, что вы можете создать продукт, который потенциально может стать настоящим сервисом».* — nFactorial

Это — ответ.

**Рынок есть.** Приложения с ежедневной головоломкой — уже доказанная подписочная категория. NYT Games построил многомиллионный подписочный бизнес вокруг Mini Crossword, Wordle, Connections — и все они работают по схеме *одна задача, двенадцать минут, общая для всех, каждый день*. Судоку такого же уровня полировки — заметный пробел.

**Монетизация подключена, а не запланирована.**
- **Pro · $4 / мес** — подписка Stripe, работает в [`lib/stripe`](lib/stripe). Целит в естественные 3–8% бесплатных пользователей, которые апгрейдятся ради безлимитного подсказчика, уровня Expert и скинов.
- **Разовые SKU за скины** — разовые платежи Stripe, работают. Sumi‑e за $1 — это эмоциональная покупка без обязательств.
- **Заморозки стрика** (планируется, модель данных есть) — микро‑покупка, валидированная Duolingo. Монетизирует страх потери, который продукт в остальном не использует как оружие.

**Удержание встроено в структуру, а не приклеено.** Четыре вложенных триггера возврата — дневной ритуал → стрик → иероглиф дня + свиток года → ачивки. Каждый слой накапливается. Пропустил день — стрик потерян, но свиток года продолжает заполняться, поэтому даже отвалившийся пользователь имеет частичную запись, тянущую его назад.

**Привлечение встроено в момент победы.** Каждая решённая дневная задача серверно рендерит OG‑карточку (иероглиф + время + стрик впечатаны в PNG 1080×1080 через `@vercel/og`). Рассчитана на прямой шаринг в Telegram / Twitter / Instagram — каждая решённая задача работает как рекрутер, отдельная фича «поделиться» не нужна.

**Юнит‑экономика сходится.** Gemini 2.5 Flash стоит примерно $0.0003 за вызов подсказчика. Дневная квота в 20 вызовов ограничивает худший случай бесплатного пользователя примерно $0.18/мес в стоимости AI. Одна подписка Pro покрывает тысячи вызовов. Потолок инфраструктурных расходов — заметно ниже любого разумного пола LTV.

**Защита — в комбинации, а не в одном куске.** Судоку напишет кто угодно. Защищаемые куски: (а) *одна общая дневная задача*, (б) подсказчик, который *реально отказывается сливать*, и (в) *цельный дизайн‑язык*, о котором люди постят. Каждая часть по отдельности — сложно; вместе — продуктовая личность, которая не выпадает из чеклиста фич.

---

## Продуктовая поверхность

### Дневная задача

- Одна задача, одна и та же для всех, открывается в полночь локально и доступна тридцать часов.
- Всегда **Hard**. (Casual‑режим рядом, если хочется больше.)
- На главной — живой счётчик: *N решают сейчас · M в твоём городе · первый — в HH:MM.*

### Четыре уровня

| Знак | Уровень | Открыто | Целевое время |
| :--: | :------ | :-----: | :-----------: |
| 易   | Easy    | 38      | ~4:12         |
| 中   | Medium  | 30      | ~8:30         |
| 難   | Hard    | 26      | ~14:50        |
| 極   | Expert  | 22      | 23:00+        |

Генератор гарантирует **единственное** решение. Решатель распознаёт шесть классических техник — см. [Инженерные акценты](#инженерные-акценты).

### Sensei · подсказчик (не чат‑бот)

Двухрежимный AI‑подсказчик на **Gemini 2.5 Flash**.

| Режим | Что говорит                                                  | Что не говорит никогда |
| ----- | ------------------------------------------------------------ | :--------------------- |
| nudge | технику и юнит («naked pair в строке 6»)                     | клетку, цифру          |
| ask   | клетку и цифру («R6C8 = 7») + одно предложение объяснения    | остальной путь решения |

Системный промпт для `nudge` написан вручную так, чтобы держать строй даже под давлением. Бесплатно — 20 вызовов в день. Pro — без ограничений.

### Календарь печатей · 365 иероглифов в год

У каждого дня свой иероглиф из тщательно собранного банка (`月` луна, `火` огонь, `水` вода, `木` дерево, `山` гора…), плюс одно предложение от **Сэнсэя** — сгенерировано Gemini с зафиксированным промптом:

> *«8–14 слов, настоящее время, отсылка к образу иероглифа, скупо и приземлённо, без эмодзи и восклицаний».*

**Свиток года** рендерит всю 365‑дневную сетку в пяти состояниях:

```
█  заполнено      ▒  сегодня        □  пусто
▓  заморозка      ·  будущее
```

Прокручивается. Заполняется. Пропущенные дни видны — не замазаны.

### Двенадцать знаков · ачивки

Иероглифы вместо иконок. Два знака скрыты, пока не получены.

| Знак | Имя                  | Условие |
| :--: | :------------------- | :------ |
| 連   | Семь дней            | стрик 7 дней |
| 月   | Месяц удержан        | стрик 30 дней |
| 百   | Сто дней             | стрик 100 дней |
| 速   | Меньше трёх          | Easy за < 3:00 |
| 鋭   | Остро на Hard        | Hard за < 10:00 |
| 神   | Божественно на Expert | Expert за < 25:00 |
| 初   | Первый               | первая сдача за день в мире |
| 暁   | До рассвета          | решение до 06:00 локально |
| ?    | *скрыто*             | *— четыре знака находятся через игру* |

### Pro · «три вещи, ничего больше»

$4 в месяц. Страница Pro формулирует обещание прямо:

1. **先 · Безлимитный подсказчик** — без дневного потолка.
2. **極 · Expert + архив** — каждая прошедшая дневная задача открыта.
3. **完 · Все скины** — вся библиотека, пока вы подписаны.

### Скины · сезонные, премиум, заработанные

Косметические темы, которые меняют не только палитру, но и иероглиф печати и текст шапки.

- **Сезонные** — весна `桜`, лето `蓮`, осень `楓`, зима `雪`. Бесплатны в свой сезон, в архиве — для Pro.
- **Премиум** — Sumi‑e `墨`, Indigo `藍`. Разовая покупка или включены в Pro.
- **Challenge‑locked** — Matsuri `祭` (стрик 7 дней), Koi `鯉` (30 решений), Yūrei `幽` (решить в 3 утра). Бесплатны после получения.

### Общая летопись

- **Таблица лидеров** — фильтры по дате, городу, диапазону (сегодня / 7д / всё).
- **Городской ранг** — показывается на главной, если ваше время попадает в верх таблицы вашего города.
- **OG‑карточки** — 1080×1080, рендерятся на edge через `@vercel/og`, чтобы решённую задачу можно было запостить с уже впечатанными иероглифом, временем и стриком.

---

## Инженерные акценты

Четыре вещи в этом репозитории, потребовавшие настоящих усилий:

### 1 · Решатель, который *ранжирует* подсказки

[`lib/sudoku/techniques.ts`](lib/sudoku/techniques.ts) реализует шесть классических техник в строгом порядке сложности:

```
naked-single  →  hidden-single  →  locked-candidate
   →  naked-pair  →  hidden-pair  →  x-wing
```

Каждая подсказка несёт `{ index, value, technique, unit, cells, reason }` — UI и подсвечивает клетку, и объясняет *почему* на языке решения («только R6C8 может содержать 7»). Это то, что позволяет подсказчику говорить как учитель, а не как ответник.

### 2 · Промпт подсказчика, который умеет отказывать

Сложность `nudge`‑режима не в том, чтобы вызвать Gemini, — а в том, чтобы написать системный промпт, который выдерживает давление. Промпт:

- явно называет технику и юнит
- запрещает называть конкретную клетку или цифру
- запрещает обходные конструкции вроде «не скажу, но это R6C8»

См. [`lib/coach/prompt.ts`](lib/coach/prompt.ts). Квота считается по пользователю в Postgres — единичный недобросовестный клиент не сожжёт счёт.

### 3 · Генератор с верификатором в CI

`scripts/verify-generator.ts` (через `npm run verify-generator`) генерирует пачку задач и прогоняет каждую через решатель, чтобы убедиться в **единственности** решения. Новые сиды без этого не уходят.

### 4 · Скины — данные, а не код

Скины лежат в Postgres ([`lib/skins/registry.ts`](lib/skins/registry.ts)), а единый резолвер каталога ([`lib/skins/catalog.ts`](lib/skins/catalog.ts)) переводит `(скин, зритель, дата) → действие`. Добавить скин — вставить строку, а не выкатывать релиз.

---

## Поверх ТЗ

> *«Не обязательно делать всё 100% как в техническом задании. Покажите свою креативность, расскажите нам об этом в README.md ❤»* — nFactorial

Три места, где мы воспользовались разрешением:

**1 · Настоящий дизайн‑язык.** Mincho‑шрифт с засечками, киноварный `朱` акцент, тушь `墨`, костяная `骨` бумага. Газетная шапка, а не приложенческий хром. Печать **完** ставится с наклоном — потому что ничто, что штампуют от руки, не ложится ровно. У бренда свой [VermillionStamp component](components/landing/VermillionStamp.tsx).

**2 · Ритуал, а не игра.** Календарь печатей, иероглиф дня с прочтением, годовой свиток, отсутствие попапа «спаси стрик» — это не «дополнительные фичи», это **форма** продукта. Они превращают его из *того, во что играют*, в *то, что делают*.

**3 · Подсказчик со вкусом.** Большинство LLM‑подсказчиков либо (а) держат так много, что бесполезны, либо (б) выкладывают ответ при первом давлении. Два чётко ограниченных режима — и системный промпт, который не сдаётся в `nudge` даже под нажимом — это действительно тонкая работа.

---

## Стек

| Слой              | Выбор |
| :---------------- | :----- |
| Каркас            | Next.js 14 (App Router), React 18, TypeScript 5.7 |
| Стейт             | Zustand |
| Стилизация        | Tailwind + CSS‑переменные для палитр скинов |
| Анимация          | Framer Motion (скупо — продукт вознаграждает тишину) |
| Auth + БД         | Supabase (Postgres + RLS) |
| Платежи           | Stripe (подписка + разовые SKU за скины) |
| AI                | Google Gemini 2.5 Flash (`@google/genai`) |
| OG‑картинки       | `@vercel/og` (edge runtime, 1080×1080) |
| UI‑примитивы      | Radix (dialog · dropdown · toast) |
| Телеметрия        | `@vercel/speed-insights` |
| Тесты             | Vitest + React Testing Library + jsdom |

---

## Запуск

```bash
git clone <repo>
cd sudoku
npm install
cp .env.example .env.local        # SUPABASE_* · STRIPE_* · GOOGLE_API_KEY
npm run dev                       # → http://localhost:3000
```

Полезные команды:

```bash
npm run typecheck                 # tsc --noEmit, strict
npm run lint                      # next lint
npm test                          # vitest run
npm run verify-generator          # пакетная проверка единственности задач
npm run seed                      # сидинг дневных задач
npm run seed-seal                 # сидинг годового календаря иероглифов
npm run seed-skins                # сидинг каталога скинов
npm run generate-sfx              # перегенерировать solve-thunk / solve-tone
```

---

## Карта проекта

```
app/                    маршруты Next.js App Router
  api/                  coach · daily · seal · share · вебхуки stripe
  play/[difficulty]/    страница доски
  pro/                  пейволл
  leaderboard/          общая летопись
  year/                 свиток на 365 дней
  achievements/         двенадцать знаков
  skins/                каталог
  profile/              аккаунт + выбор города
  auth/                 хэндофф supabase auth

components/
  game/                 Board · Cell · NumberPad · CoachPopover · WinModal · Timer
  landing/              маркетинговая страница для незалогиненных
  year-scroll/          календарь + поповер печати дня
  skins/                чип скина + превью
  stats/                строки таблицы + счётчики по городам
  ui/                   примитивы shadcn (button, dialog, toast)

lib/
  sudoku/               генератор · решатель · 6 техник · единственность
  coach/                промпты Gemini + дневные квоты
  seal/                 календарь · стрик · заморозка · голос Сэнсэя
  skins/                каталог · реестр · права · резолвер viewer
  stats/                математика лидерборда + ранг
  achievements.ts       12 знаков, 4 скрыто
  stripe/               checkout + обработчики вебхуков
  supabase/             серверная + браузерная фабрика клиента
  kanji.ts              форматирование даты в иероглифах
  kanji-bank.ts         банк дневных иероглифов

scripts/                seed‑скрипты + CLI‑проверки
tests/                  тесты vitest (skins, sfx, seal/streak, seal/calendar, …)
supabase/               миграции
```

---

## Планка качества

- **TypeScript strict**, без `any` в подсказчике и квотах.
- **Vitest** покрывает то, что не имеет права регрессить: резолвер прав на скины (free / Pro / challenge / season), вычисление стрика на границах заморозки, состояние календаря, серверный кэш SFX.
- **Верификатор генератора** в `scripts/verify-generator.ts` — ворота против выкатки задач с неуникальным решением.
- **RLS‑политики** живут в `supabase/migrations` — клиент никогда не верит своему собственному заявлению о том, кто он.
- **Квота подсказчика** считается на сервере в Postgres, не клиентским rate‑limit.

---

## Дальше

Честный список того, чего здесь пока нет:

- [ ] Мобильный PWA‑install (сейчас адаптивно, но не устанавливается)
- [ ] Push‑уведомление в 00:00 локально, когда открывается дневная
- [ ] Replay‑режим — пройти своё решение пошагово после
- [ ] «Двое против одной задачи» — общий грид, бок о бок
- [ ] Авто‑выдача challenge‑скинов по событию (подсказки в каталоге есть; триггер — нет)
- [ ] UI покупки заморозки стрика (модель данных есть; флоу покупки нет)
- [ ] OG‑карточки для майлстоунов стрика (сейчас только за дневную)

---

<div align="center">

— *open the box · 箱を開けて* —

<sub>Hako · v1.0</sub>

</div>
