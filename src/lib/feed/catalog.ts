export type Clip = {
  id: string;
  src: string;
  poster: string;
  duration: number;
  handle: string;
  displayName: string;
  scene: string;
  caption: string;
  sound: string;
  seedLikes: number;
};

const V = "v13";

export const CLIPS: Clip[] = [
  {
    id: "cold-email",
    src: `/clips/cold-email.mp4?v=${V}`,
    poster: `/stills/cold-email.jpg?v=${V}`,
    duration: 10,
    handle: "mikehawk",
    displayName: "Mike Hawk",
    scene: "Cold email",
    caption:
      "pov: you're a cold email. purpose of visit? 'quick question' isn't a purpose. wait with the others.",
    sound: "letterbox click · Nob",
    seedLikes: 247,
  },
  {
    id: "unsubscribe",
    src: `/clips/unsubscribe.mp4?v=${V}`,
    poster: `/stills/unsubscribe.jpg?v=${V}`,
    duration: 5,
    handle: "mikehawk",
    displayName: "Mike Hawk",
    scene: "Lifehacker",
    caption: "lifehacker: the unsubscribe button? look at me. i am the unsubscribe button.",
    sound: "stamp thud · original",
    seedLikes: 4800,
  },
  {
    id: "rain",
    src: `/clips/rain.mp4?v=${V}`,
    poster: `/stills/rain.jpg?v=${V}`,
    duration: 8,
    handle: "mikehawk",
    displayName: "Mike Hawk",
    scene: "Cold exposure",
    caption:
      "cold exposure. five minutes daily. others buy ice barrels. britain provides.",
    sound: "rain on paving · original",
    seedLikes: 5,
  },
  {
    id: "followers",
    src: `/clips/followers.mp4?v=${V}`,
    poster: `/stills/followers.jpg?v=${V}`,
    duration: 10,
    handle: "mikehawk",
    displayName: "Mike Hawk",
    scene: "100 followers",
    caption:
      "this week the account reached 100 followers. naturally i reviewed them. 12 remain. thank you for applying.",
    sound: "pen scratch · original",
    seedLikes: 12,
  },
  {
    id: "denials",
    src: `/clips/denials.mp4?v=${V}`,
    poster: `/stills/denials.jpg?v=${V}`,
    duration: 8,
    handle: "mikehawk",
    displayName: "Mike Hawk",
    scene: "Denials",
    caption: "the moves are all denials. mr bingley kept the armchair. i kept the pin.",
    sound: "ring light · Mr Bingley",
    seedLikes: 2021,
  },
  {
    id: "prank",
    src: `/clips/prank.mp4?v=${V}`,
    poster: `/stills/prank.jpg?v=${V}`,
    duration: 12,
    handle: "mikehawk",
    displayName: "Mike Hawk",
    scene: "Prank",
    caption:
      "pranking management. wish me luck. prank concluded. i'll be writing myself up.",
    sound: "stamp thud · Mr Bingley",
    seedLikes: 1,
  },
  {
    id: "biscuit",
    src: `/clips/biscuit.mp4?v=${V}`,
    poster: `/stills/biscuit.jpg?v=${V}`,
    duration: 12,
    handle: "mikehawk",
    displayName: "Mike Hawk",
    scene: "Applicant",
    caption:
      "today we review an applicant. structure firm. intentions clear. chocolate hides things. you may enter.",
    sound: "biscuit crunch · original",
    seedLikes: 98,
  },
  {
    id: "podcast",
    src: `/clips/podcast.mp4?v=${V}`,
    poster: `/stills/podcast.jpg?v=${V}`,
    duration: 15,
    handle: "mikehawk",
    displayName: "Mike Hawk",
    scene: "Podcast",
    caption:
      "three habits of high performers. standing. waiting. latching. 'bro that's so powerful.' was there a question coming or was that the visit? one word for the listeners. denied.",
    sound: "denied · original",
    seedLikes: 3,
  },
  {
    id: "commute",
    src: `/clips/commute.mp4?v=${V}`,
    poster: `/stills/commute.jpg?v=${V}`,
    duration: 25,
    handle: "mikehawk",
    displayName: "Mike Hawk",
    scene: "Day in the life",
    caption:
      "day in the life. 6:58 the commute. traffic was reasonable. 7 o'clock we're open. 12:30 lunch at the desk. the desk is a door. 5 o'clock clocking off. i live at work. it's called passion.",
    sound: "hallway footsteps · original",
    seedLikes: 658,
  },
  {
    id: "egg",
    src: `/clips/egg.mp4?v=${V}`,
    poster: `/stills/egg.jpg?v=${V}`,
    duration: 15,
    handle: "mikehawk",
    displayName: "Mike Hawk",
    scene: "What I'm having",
    caption:
      "people ask what i'm having. the egg. the rest is admin. seasoned with nothing, as breakfast should be. and these are for afters.",
    sound: "fork on plate · original",
    seedLikes: 1,
  },
  {
    id: "grwm",
    src: `/clips/grwm.mp4?v=${V}`,
    poster: `/stills/grwm.jpg?v=${V}`,
    duration: 12,
    handle: "mikehawk",
    displayName: "Mike Hawk",
    scene: "Closet",
    caption:
      "grwm for the door. no skincare. standards don't moisturise. buttons. descend. right. who's knocking.",
    sound: "hanger scrape · Nob",
    seedLikes: 312,
  },
  {
    id: "mum",
    src: `/clips/mum.mp4?v=${V}`,
    poster: `/stills/mum.jpg?v=${V}`,
    duration: 15,
    handle: "mikehawk",
    displayName: "Mike Hawk",
    scene: "She's ready",
    caption:
      "i don't usually show this side of me. yesterday my own mother asked me my purpose of visit. i have never been prouder. she's ready.",
    sound: "letterbox · original",
    seedLikes: 1,
  },
  {
    id: "comments",
    src: `/clips/comments.mp4?v=${V}`,
    poster: `/stills/comments.jpg?v=${V}`,
    duration: 20,
    handle: "mikehawk",
    displayName: "Mike Hawk",
    scene: "Comments",
    caption:
      "you've had things to say. i've printed them. 'bro guards a letterbox.' correct. 'who hurt you?' a mass mailing, march. 'drop the skincare routine.' dropped. the rest didn't pass moderation.",
    sound: "paper shuffle · original",
    seedLikes: 1,
  },
  {
    id: "hold",
    src: `/clips/hold.mp4?v=${V}`,
    poster: `/stills/hold.jpg?v=${V}`,
    duration: 20,
    handle: "mikehawk",
    displayName: "Mike Hawk",
    scene: "4:59",
    caption:
      "4:59. the alarm is decorative. i was already here. five o'clock: cold exposure. the door provides. 5:01 gratitude journal. nothing. nothing got in last night. grateful. 5:02 now we hold. winners hold.",
    sound: "door hold · original",
    seedLikes: 502,
  },
  {
    id: "eat",
    src: `/clips/eat.mp4?v=${V}`,
    poster: `/stills/eat.jpg?v=${V}`,
    duration: 15,
    handle: "mikehawk",
    displayName: "Mike Hawk",
    scene: "What I eat in a day",
    caption:
      "what i eat in a day. all three passed vetting. breakfast: grey, honest, no agenda. lunch declared itself at the door. pudding is from an approved sender. my mum.",
    sound: "porridge stir · original",
    seedLikes: 3,
  },
  {
    id: "sounds",
    src: `/clips/sounds.mp4?v=${V}`,
    poster: `/stills/sounds.jpg?v=${V}`,
    duration: 15,
    handle: "mikehawk",
    displayName: "Mike Hawk",
    scene: "Sounds of the job",
    caption:
      "some of you asked for the sounds of the job. denied. denied. the rarest sound of all? approval. you won't hear it often.",
    sound: "denied. denied. · original",
    seedLikes: 1104,
  },
  {
    id: "flat",
    src: `/clips/flat.mp4?v=${V}`,
    poster: `/stills/flat.jpg?v=${V}`,
    duration: 20,
    handle: "mikehawk",
    displayName: "Mike Hawk",
    scene: "Things in my flat",
    caption:
      "things in my flat that just make sense. crowd control. arrivals lounge. one arrival today: it can wait. guest book, one entry, 2021. he didn't sign it himself. i had to. and management.",
    sound: "velvet rope · Mr Bingley",
    seedLikes: 2021,
  },
  {
    id: "statement",
    src: `/clips/statement.mp4?v=${V}`,
    poster: `/stills/statement.jpg?v=${V}`,
    duration: 30,
    handle: "mikehawk",
    displayName: "Mike Hawk",
    scene: "There's been talk",
    caption:
      "there's been talk. in 2021 i approved an applicant. three days at the door. he now holds the armchair. and, since the review, my line manager position. he sleeps 16 hours a day. i take full accountability. i suspended myself. unpaid, as is right. i've since promoted myself back. we move on. please respect my privacy at this time.",
    sound: "paper rustle · original",
    seedLikes: 2021,
  },
  {
    id: "inbox",
    src: `/clips/inbox.mp4?v=${V}`,
    poster: `/stills/inbox.jpg?v=${V}`,
    duration: 30,
    handle: "mikehawk",
    displayName: "Mike Hawk",
    scene: "The Internet",
    caption:
      "soon? i do all of them. every inbox on earth. a warm intro is still an intro, mum. the world waits.",
    sound: "office stamp · Nob",
    seedLikes: 39,
  },
  {
    id: "storytime",
    src: `/clips/storytime.mp4?v=${V}`,
    poster: `/stills/storytime.jpg?v=${V}`,
    duration: 30,
    handle: "mikehawk",
    displayName: "Mike Hawk",
    scene: "Storytime",
    caption:
      "you've been asking. the day i almost let someone in. subject: no agenda. forty seconds. i timed it. then the header: forty thousand of us. all feeling special. the stamp came down. it always comes down.",
    sound: "stamp hover · original",
    seedLikes: 40000,
  },
];

export function clipById(id: string) {
  return CLIPS.find((clip) => clip.id === id);
}

export function clipIndex(id: string) {
  return CLIPS.findIndex((clip) => clip.id === id);
}
