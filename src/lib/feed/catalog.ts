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

const V = "v11";

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
