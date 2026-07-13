import type { ReviewPackage, ReviewPackageInput } from "./types";

const clean = (value: string, fallback: string) => value.trim() || fallback;

export function generateReviewPackage(input: ReviewPackageInput): ReviewPackage {
  const title = clean(input.movieTitle, "This movie");
  const worked = clean(input.whatWorked, "the strongest moments");
  const didnt = clean(input.whatDidnt, "a few choices that keep it from landing perfectly");
  const audience = clean(input.audience, "movie fans deciding what is worth their time and money");
  const rawThoughts = clean(input.rawThoughts, "I want the review to be direct, useful, and easy to search.");
  const spoiler = input.spoilerLevel.toLowerCase();
  const rating = `${input.rating}/5`;

  return {
    hook: `Is ${title} actually worth the ticket?`,
    voiceover: `${spoiler} review: ${title} is for ${audience}. What works: ${worked}. What does not: ${didnt}. My gut check is simple: ${rawThoughts} If you are spending time and money on one movie this week, ${title} needs to justify the seat, the snacks, and the scroll-stopping attention. Final verdict: ${rating}.`,
    carouselSlides: [
      `Is ${title} worth your time and money?`,
      `What works: ${worked}.`,
      `What holds it back: ${didnt}.`,
      `Best audience: ${audience}.`
    ],
    finalVerdictSlide: `Worth the Ticket? ${rating} — ${clean(input.rawThoughts, "a clear yes for the right audience.")}`,
    tiktokCaption: `${title} review: is it worth your time and money? ${rating}`,
    xCaption: `${title}: Worth the Ticket? ${rating}. ${worked} works, but ${didnt} keeps the verdict honest.`,
    hashtags: ["#WorthTheTicket", "#MovieReview", "#FilmTok", "#TikTokMovies", "#MovieTok", "#NowWatching"]
  };
}
