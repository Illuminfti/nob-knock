# Knock

Mike Hawk. For You.

A vertical, infinite-scroll feed of the Nob: thirteen clips, one doorman, zero tolerance for "quick question."

Tap for sound. Double-tap to like. Sign in with X to keep receipts on file.

- Live: [nob-knock.vercel.app](https://nob-knock.vercel.app)
- Repo: [github.com/Illuminfti/nob-knock](https://github.com/Illuminfti/nob-knock)

## The clips

| # | Scene | Caption |
|---|---|---|
| 1 | Cold email | pov: you're a cold email. purpose of visit? 'quick question' isn't a purpose. wait with the others. |
| 2 | Lifehacker | lifehacker: the unsubscribe button? look at me. i am the unsubscribe button. |
| 3 | Cold exposure | cold exposure. five minutes daily. others buy ice barrels. britain provides. |
| 4 | Denials | the moves are all denials. mr bingley kept the armchair. i kept the pin. |
| 5 | Applicant | today we review an applicant. structure firm. intentions clear. chocolate hides things. you may enter. |
| 6 | Day in the life | day in the life. 6:58 the commute. traffic was reasonable. 7 o'clock we're open. 12:30 lunch at the desk. the desk is a door. 5 o'clock clocking off. i live at work. it's called passion. |
| 7 | Closet | grwm for the door. no skincare. standards don't moisturise. buttons. descend. right. who's knocking. |
| 8 | Comments | you've had things to say. i've printed them. 'bro guards a letterbox.' correct. 'who hurt you?' a mass mailing, march. 'drop the skincare routine.' dropped. the rest didn't pass moderation. |
| 9 | What I eat in a day | what i eat in a day. all three passed vetting. breakfast: grey, honest, no agenda. lunch declared itself at the door. pudding is from an approved sender. my mum. |
| 10 | Sounds of the job | some of you asked for the sounds of the job. denied. denied. the rarest sound of all? approval. you won't hear it often. |
| 11 | Things in my flat | things in my flat that just make sense. crowd control. arrivals lounge. one arrival today: it can wait. guest book, one entry, 2021. he didn't sign it himself. i had to. and management. |
| 12 | The Internet | soon? i do all of them. every inbox on earth. a warm intro is still an intro, mum. the world waits. |
| 13 | Storytime | you've been asking. the day i almost let someone in. subject: no agenda. forty seconds. i timed it. then the header: forty thousand of us. all feeling special. the stamp came down. it always comes down. |

## Voice

Short, deadpan, British, bureaucratic. Nobody in this universe winks. Specific asks only.

The writer's bible lives in [`docs/mike-hawk-writers-bible.md`](docs/mike-hawk-writers-bible.md).

## Run

```bash
npm install
npm run dev
```

Clips sit in `public/clips/`. Captions, posters, and seed likes live in `src/lib/feed/catalog.ts`.
