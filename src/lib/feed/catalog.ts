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

const V = "real10";

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
      "pov: you're a cold email. purpose of visit? quick question isn't a purpose. tell the others.",
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
    caption: "lifehacker: the unsubscribe button? i am the unsubscribe button.",
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
    caption: "the moves are all denials. mr bingley kept the armchair.",
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
      "grwm for the door. decided. buttons. descend. standards don't skincare. right. who's knocking today.",
    sound: "hanger scrape · Nob",
    seedLikes: 312,
  },
  {
    id: "church",
    src: `/clips/church.mp4?v=${V}`,
    poster: `/stills/church.jpg?v=${V}`,
    duration: 15,
    handle: "mikehawk",
    displayName: "Mike Hawk",
    scene: "Church porch",
    caption: "sunday. name. purpose of visit. the lord is already on the list.",
    sound: "church porch wind · Nob",
    seedLikes: 12,
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
    id: "date",
    src: `/clips/date.mp4?v=${V}`,
    poster: `/stills/date.jpg?v=${V}`,
    duration: 20,
    handle: "mikehawk",
    displayName: "Mike Hawk",
    scene: "Community hall",
    caption:
      "pov: you're on a date. purpose of visit? we booked an hour. the bell has spoken.",
    sound: "community hall bell · original",
    seedLikes: 1,
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
    id: "fridge",
    src: `/clips/fridge.mp4?v=${V}`,
    poster: `/stills/fridge.jpg?v=${V}`,
    duration: 30,
    handle: "mikehawk",
    displayName: "Mike Hawk",
    scene: "Fridge",
    caption:
      "the cold does not leave without authorisation. neither do the leftovers.",
    sound: "fridge hum · Nob",
    seedLikes: 2019,
  },
];

export function clipById(id: string) {
  return CLIPS.find((clip) => clip.id === id);
}

export function clipIndex(id: string) {
  return CLIPS.findIndex((clip) => clip.id === id);
}
