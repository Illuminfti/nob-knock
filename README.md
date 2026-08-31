# Knock

Mike Hawk. For You.

A vertical, infinite-scroll feed of the Nob: ten clips, one doorman, zero tolerance for "quick question."

Tap for sound. Double-tap to like. Sign in with X to keep receipts on file.

Repo: [github.com/Illuminfti/nob-knock](https://github.com/Illuminfti/nob-knock)

## The clips

| # | Scene | Caption |
|---|---|---|
| 1 | Cold email | pov: you're a cold email. purpose of visit? 'quick question' isn't a purpose. wait with the others. |
| 2 | Lifehacker | lifehacker: the unsubscribe button? look at me. i am the unsubscribe button. |
| 3 | Denials | the moves are all denials. mr bingley kept the armchair. i kept the pin. |
| 4 | Applicant | today we review an applicant. structure firm. intentions clear. chocolate hides things. you may enter. |
| 5 | Closet | grwm for the door. no skincare. standards don't moisturise. buttons. descend. right. who's knocking. |
| 6 | What I eat in a day | what i eat in a day. all three passed vetting. breakfast: grey, honest, no agenda. lunch declared itself at the door. pudding is from an approved sender. my mum. |
| 7 | Sounds of the job | some of you asked for the sounds of the job. denied. denied. the rarest sound of all? approval. you won't hear it often. |
| 8 | Things in my flat | things in my flat that just make sense. crowd control. arrivals lounge. one arrival today: it can wait. guest book, one entry, 2021. he didn't sign it himself. i had to. and management. |
| 9 | The Internet | soon? i do all of them. every inbox on earth. a warm intro is still an intro, mum. the world waits. |
| 10 | Storytime | you've been asking. the day i almost let someone in. subject: no agenda. forty seconds. i timed it. then the header: forty thousand of us. all feeling special. the stamp came down. it always comes down. |

## Voice

Short, deadpan, British, bureaucratic. Nobody in this universe winks. Specific asks only.

The writer's bible lives in [`docs/mike-hawk-writers-bible.md`](docs/mike-hawk-writers-bible.md).

## Run

```bash
npm install
npm run dev
```

Clips sit in `public/clips/`. Captions, posters, and seed likes live in `src/lib/feed/catalog.ts`.
