export type WatchLocation = "Theater" | "Streaming";
export type SpoilerLevel = "Non-spoiler" | "Light spoilers" | "Spoiler";
export type ReviewStatus = "Not started" | "Drafted" | "Posted";

export type MovieEntry = {
  id: string;
  title: string;
  dateWatched: string;
  watchLocation: WatchLocation;
  genre: string;
  rating: number;
  spoilerLevel: SpoilerLevel;
  reviewStatus: ReviewStatus;
  tiktokPosted: boolean;
  notes: string;
  finalVerdict: string;
};

export type ReviewPackageInput = {
  movieTitle: string;
  rating: number;
  rawThoughts: string;
  whatWorked: string;
  whatDidnt: string;
  audience: string;
  spoilerLevel: SpoilerLevel;
};

export type ReviewPackage = {
  hook: string;
  voiceover: string;
  carouselSlides: string[];
  finalVerdictSlide: string;
  tiktokCaption: string;
  xCaption: string;
  hashtags: string[];
};
