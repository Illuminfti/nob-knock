# Knock

Mike Hawk. For You.

A vertical, infinite-scroll feed of the Nob: twenty clips, one doorman, zero tolerance for "quick question."

The feed only keeps three decoders warm (current, previous, next). Clips stream from the first frame — they are not held at the door until the whole file arrives.

Tap for sound. Double-tap to like. Sign in with X to keep receipts on file.

- Live: [nob-knock.vercel.app](https://nob-knock.vercel.app)
- Repo: [github.com/Illuminfti/nob-knock](https://github.com/Illuminfti/nob-knock)

## The clips

| # | Scene | Caption |
|---|---|---|
| 1 | Cold email | quick question isn't a purpose of visit. wait with the others. |
| 2 | Lifehacker | look at me. i am the unsubscribe button. |
| 3 | Cold exposure | cold exposure. ice barrels are for people without britain. |
| 4 | 100 followers | 100 knocked. 12 remain. thank you for applying. |
| 5 | Denials | mr bingley kept the armchair. i kept the pin. |
| 6 | Prank | pranked my manager. writing myself up. |
| 7 | Applicant | chocolate hides things. you may enter. |
| 8 | Podcast | one word for the listeners. denied. |
| 9 | Day in the life | the desk is a door. i live at work. it's called passion. |
| 10 | What I'm having | the egg. the rest is admin. |
| 11 | Closet | no skincare. standards don't moisturise. |
| 12 | She's ready | mum asked my purpose of visit. never been prouder. |
| 13 | Comments | i printed your comments. most failed moderation. |
| 14 | 4:59 | the alarm is decorative. winners hold. |
| 15 | What I eat in a day | all three vetted. pudding is from mum. |
| 16 | Sounds of the job | the rarest sound is approval. you won't hear it. |
| 17 | Things in my flat | one guest since 2021. i had to sign him in. |
| 18 | There's been talk | he has my job now. i take full accountability. we move on. |
| 19 | The Internet | every inbox on earth. a warm intro is still an intro, mum. |
| 20 | Storytime | the day i almost said yes. then i counted the us. |

## Voice

Short, deadpan, British, bureaucratic. Nobody in this universe winks. Specific asks only.

The writer's bible lives in [`docs/mike-hawk-writers-bible.md`](docs/mike-hawk-writers-bible.md).

## Run

```bash
npm install
npm run dev
```

Clips sit in `public/clips/`. Captions, posters, and seed likes live in `src/lib/feed/catalog.ts`.
