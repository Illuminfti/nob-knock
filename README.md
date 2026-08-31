# Knock

Mike Hawk. For You.

A vertical, infinite-scroll feed of the Nob: twenty clips, one doorman, zero tolerance for "quick question."

Tap for sound. Double-tap to like. Sign in with X to keep receipts on file.

- Live: [nob-knock.vercel.app](https://nob-knock.vercel.app)
- Repo: [github.com/Illuminfti/nob-knock](https://github.com/Illuminfti/nob-knock)

## The clips

| # | Scene | Caption |
|---|---|---|
| 1 | Cold email | pov: you're a cold email. purpose of visit? 'quick question' isn't a purpose. wait with the others. |
| 2 | Lifehacker | lifehacker: the unsubscribe button? look at me. i am the unsubscribe button. |
| 3 | Cold exposure | cold exposure. five minutes daily. others buy ice barrels. britain provides. |
| 4 | 100 followers | this week the account reached 100 followers. naturally i reviewed them. 12 remain. thank you for applying. |
| 5 | Denials | the moves are all denials. mr bingley kept the armchair. i kept the pin. |
| 6 | Prank | pranking management. wish me luck. prank concluded. i'll be writing myself up. |
| 7 | Applicant | today we review an applicant. structure firm. intentions clear. chocolate hides things. you may enter. |
| 8 | Podcast | three habits of high performers. standing. waiting. latching. 'bro that's so powerful.' was there a question coming or was that the visit? one word for the listeners. denied. |
| 9 | Day in the life | day in the life. 6:58 the commute. traffic was reasonable. 7 o'clock we're open. 12:30 lunch at the desk. the desk is a door. 5 o'clock clocking off. i live at work. it's called passion. |
| 10 | What I'm having | people ask what i'm having. the egg. the rest is admin. seasoned with nothing, as breakfast should be. and these are for afters. |
| 11 | Closet | grwm for the door. no skincare. standards don't moisturise. buttons. descend. right. who's knocking. |
| 12 | She's ready | i don't usually show this side of me. yesterday my own mother asked me my purpose of visit. i have never been prouder. she's ready. |
| 13 | Comments | you've had things to say. i've printed them. 'bro guards a letterbox.' correct. 'who hurt you?' a mass mailing, march. 'drop the skincare routine.' dropped. the rest didn't pass moderation. |
| 14 | 4:59 | 4:59. the alarm is decorative. i was already here. five o'clock: cold exposure. the door provides. 5:01 gratitude journal. nothing. nothing got in last night. grateful. 5:02 now we hold. winners hold. |
| 15 | What I eat in a day | what i eat in a day. all three passed vetting. breakfast: grey, honest, no agenda. lunch declared itself at the door. pudding is from an approved sender. my mum. |
| 16 | Sounds of the job | some of you asked for the sounds of the job. denied. denied. the rarest sound of all? approval. you won't hear it often. |
| 17 | Things in my flat | things in my flat that just make sense. crowd control. arrivals lounge. one arrival today: it can wait. guest book, one entry, 2021. he didn't sign it himself. i had to. and management. |
| 18 | There's been talk | there's been talk. in 2021 i approved an applicant. three days at the door. he now holds the armchair. and, since the review, my line manager position. he sleeps 16 hours a day. i take full accountability. i suspended myself. unpaid, as is right. i've since promoted myself back. we move on. please respect my privacy at this time. |
| 19 | The Internet | soon? i do all of them. every inbox on earth. a warm intro is still an intro, mum. the world waits. |
| 20 | Storytime | you've been asking. the day i almost let someone in. subject: no agenda. forty seconds. i timed it. then the header: forty thousand of us. all feeling special. the stamp came down. it always comes down. |

## Voice

Short, deadpan, British, bureaucratic. Nobody in this universe winks. Specific asks only.

The writer's bible lives in [`docs/mike-hawk-writers-bible.md`](docs/mike-hawk-writers-bible.md).

## Run

```bash
npm install
npm run dev
```

Clips sit in `public/clips/`. Captions, posters, and seed likes live in `src/lib/feed/catalog.ts`.
