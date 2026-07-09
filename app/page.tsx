"use client";

import type { FormEvent, InputHTMLAttributes, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { generateReviewPackage } from "@/src/studio/reviewGenerator";
import type { MovieEntry, ReviewPackageInput, ReviewStatus, SpoilerLevel, WatchLocation } from "@/src/studio/types";

const STORAGE_KEY = "worth-the-ticket-movies";
const spoilerLevels: SpoilerLevel[] = ["Non-spoiler", "Light spoilers", "Spoiler"];
const reviewStatuses: ReviewStatus[] = ["Not started", "Drafted", "Posted"];
const watchLocations: WatchLocation[] = ["Theater", "Streaming"];

const emptyMovie: Omit<MovieEntry, "id"> = {
  title: "",
  dateWatched: new Date().toISOString().slice(0, 10),
  watchLocation: "Theater",
  genre: "",
  rating: 3,
  spoilerLevel: "Non-spoiler",
  reviewStatus: "Not started",
  tiktokPosted: false,
  notes: "",
  finalVerdict: ""
};

const emptyReview: ReviewPackageInput = {
  movieTitle: "",
  rating: 3,
  rawThoughts: "",
  whatWorked: "",
  whatDidnt: "",
  audience: "",
  spoilerLevel: "Non-spoiler"
};

export default function StudioDashboard() {
  const [movies, setMovies] = useState<MovieEntry[]>([]);
  const [movieForm, setMovieForm] = useState(emptyMovie);
  const [reviewInput, setReviewInput] = useState<ReviewPackageInput>(emptyReview);
  const [filters, setFilters] = useState({ genre: "", rating: "", location: "", posted: "" });

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) setMovies(JSON.parse(saved));
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(movies));
  }, [movies]);

  const packageOutput = useMemo(() => generateReviewPackage(reviewInput), [reviewInput]);
  const genres = Array.from(new Set(movies.map((movie) => movie.genre).filter(Boolean))).sort();

  const filteredMovies = movies.filter((movie) => {
    return (
      (!filters.genre || movie.genre === filters.genre) &&
      (!filters.rating || movie.rating === Number(filters.rating)) &&
      (!filters.location || movie.watchLocation === filters.location) &&
      (!filters.posted || String(movie.tiktokPosted) === filters.posted)
    );
  });

  function addMovie(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!movieForm.title.trim()) return;
    setMovies((current) => [{ ...movieForm, id: crypto.randomUUID(), title: movieForm.title.trim() }, ...current]);
    setMovieForm(emptyMovie);
  }

  function removeMovie(id: string) {
    setMovies((current) => current.filter((movie) => movie.id !== id));
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
      <header className="rounded-3xl border border-ticketGold/30 bg-theaterCard/85 p-6 shadow-2xl shadow-black/40">
        <p className="text-sm font-semibold uppercase tracking-[0.35em] text-ticketGold">Worth the Ticket?</p>
        <div className="mt-4 grid gap-4 lg:grid-cols-[1.5fr_1fr] lg:items-end">
          <div>
            <h1 className="text-4xl font-black tracking-tight sm:text-5xl">Studio Dashboard</h1>
            <p className="mt-3 max-w-3xl text-base text-zinc-300">
              A private, mobile-friendly content operating system for logging movies and turning raw opinions into repeatable review packages.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <Stat label="Logged" value={movies.length.toString()} />
            <Stat label="Posted" value={movies.filter((movie) => movie.tiktokPosted).length.toString()} />
            <Stat label="Drafts" value={movies.filter((movie) => movie.reviewStatus === "Drafted").length.toString()} />
          </div>
        </div>
      </header>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card title="Movie Log" eyebrow="Track the watchlist">
          <form onSubmit={addMovie} className="grid gap-4">
            <Input label="Movie title" value={movieForm.title} onChange={(title) => setMovieForm({ ...movieForm, title })} required />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Date watched" type="date" value={movieForm.dateWatched} onChange={(dateWatched) => setMovieForm({ ...movieForm, dateWatched })} />
              <Select label="Theater or streaming" value={movieForm.watchLocation} options={watchLocations} onChange={(watchLocation) => setMovieForm({ ...movieForm, watchLocation: watchLocation as WatchLocation })} />
              <Input label="Genre" value={movieForm.genre} onChange={(genre) => setMovieForm({ ...movieForm, genre })} />
              <Input label="Rating out of 5" type="number" min="0" max="5" step="0.5" value={String(movieForm.rating)} onChange={(rating) => setMovieForm({ ...movieForm, rating: Number(rating) })} />
              <Select label="Spoiler level" value={movieForm.spoilerLevel} options={spoilerLevels} onChange={(spoilerLevel) => setMovieForm({ ...movieForm, spoilerLevel: spoilerLevel as SpoilerLevel })} />
              <Select label="Review status" value={movieForm.reviewStatus} options={reviewStatuses} onChange={(reviewStatus) => setMovieForm({ ...movieForm, reviewStatus: reviewStatus as ReviewStatus })} />
            </div>
            <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-zinc-200">
              <input type="checkbox" checked={movieForm.tiktokPosted} onChange={(event) => setMovieForm({ ...movieForm, tiktokPosted: event.target.checked })} />
              TikTok posted
            </label>
            <Textarea label="Quick notes" value={movieForm.notes} onChange={(notes) => setMovieForm({ ...movieForm, notes })} />
            <Textarea label="Final verdict" value={movieForm.finalVerdict} onChange={(finalVerdict) => setMovieForm({ ...movieForm, finalVerdict })} />
            <button className="rounded-2xl bg-ticketGold px-5 py-3 font-bold text-ticketBlack transition hover:bg-amber-300">Add movie</button>
          </form>

          <div className="mt-6 grid gap-3 sm:grid-cols-4">
            <Select label="Genre" value={filters.genre} options={["", ...genres]} onChange={(genre) => setFilters({ ...filters, genre })} />
            <Select label="Rating" value={filters.rating} options={["", "0", "1", "2", "3", "4", "5"]} onChange={(rating) => setFilters({ ...filters, rating })} />
            <Select label="Location" value={filters.location} options={["", ...watchLocations]} onChange={(location) => setFilters({ ...filters, location })} />
            <Select label="Posted" value={filters.posted} options={["", "true", "false"]} onChange={(posted) => setFilters({ ...filters, posted })} />
          </div>

          <div className="mt-5 space-y-3">
            {filteredMovies.map((movie) => (
              <article key={movie.id} className="rounded-2xl border border-white/10 bg-black/35 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold">{movie.title}</h3>
                    <p className="text-sm text-zinc-400">{movie.dateWatched} • {movie.watchLocation} • {movie.genre || "Genre TBD"}</p>
                  </div>
                  <button onClick={() => removeMovie(movie.id)} className="text-sm text-red-300 hover:text-red-200">Remove</button>
                </div>
                <p className="mt-2 text-ticketGold">{movie.rating}/5 • {movie.spoilerLevel} • {movie.reviewStatus} • TikTok {movie.tiktokPosted ? "posted" : "not posted"}</p>
                {(movie.notes || movie.finalVerdict) && <p className="mt-2 text-sm text-zinc-300">{movie.finalVerdict || movie.notes}</p>}
              </article>
            ))}
            {filteredMovies.length === 0 && <p className="rounded-2xl border border-dashed border-white/15 p-5 text-center text-zinc-400">No movies match the current filters yet.</p>}
          </div>
        </Card>

        <Card title="Review Package Generator" eyebrow="Turn notes into content">
          <div className="grid gap-4">
            <Input label="Movie title" value={reviewInput.movieTitle} onChange={(movieTitle) => setReviewInput({ ...reviewInput, movieTitle })} />
            <Input label="Rating out of 5" type="number" min="0" max="5" step="0.5" value={String(reviewInput.rating)} onChange={(rating) => setReviewInput({ ...reviewInput, rating: Number(rating) })} />
            <Select label="Spoiler level" value={reviewInput.spoilerLevel} options={spoilerLevels} onChange={(spoilerLevel) => setReviewInput({ ...reviewInput, spoilerLevel: spoilerLevel as SpoilerLevel })} />
            <Textarea label="Raw thoughts" value={reviewInput.rawThoughts} onChange={(rawThoughts) => setReviewInput({ ...reviewInput, rawThoughts })} />
            <Textarea label="What worked" value={reviewInput.whatWorked} onChange={(whatWorked) => setReviewInput({ ...reviewInput, whatWorked })} />
            <Textarea label="What didn’t" value={reviewInput.whatDidnt} onChange={(whatDidnt) => setReviewInput({ ...reviewInput, whatDidnt })} />
            <Textarea label="Who the movie is for" value={reviewInput.audience} onChange={(audience) => setReviewInput({ ...reviewInput, audience })} />
          </div>

          <div className="mt-6 space-y-4 rounded-2xl border border-ticketGold/25 bg-ticketBlack/70 p-4">
            <Output title="1-second hook" body={packageOutput.hook} />
            <Output title="25–45 second voiceover" body={packageOutput.voiceover} />
            <Output title="4-slide carousel copy" body={packageOutput.carouselSlides.map((slide, index) => `Slide ${index + 1}: ${slide}`).join("\n")} />
            <Output title="Final verdict slide" body={packageOutput.finalVerdictSlide} />
            <Output title="TikTok caption" body={packageOutput.tiktokCaption} />
            <Output title="X caption" body={packageOutput.xCaption} />
            <Output title="Hashtags" body={packageOutput.hashtags.join(" ")} />
          </div>
        </Card>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-white/10 bg-black/35 p-3"><p className="text-2xl font-black text-ticketGold">{value}</p><p className="text-xs uppercase tracking-widest text-zinc-400">{label}</p></div>;
}

function Card({ eyebrow, title, children }: { eyebrow: string; title: string; children: ReactNode }) {
  return <section className="rounded-3xl border border-white/10 bg-theaterCard/90 p-5 shadow-xl shadow-black/30"><p className="text-xs font-bold uppercase tracking-[0.25em] text-ticketRed">{eyebrow}</p><h2 className="mt-2 text-2xl font-black">{title}</h2><div className="mt-5">{children}</div></section>;
}

function Input({ label, value, onChange, ...props }: { label: string; value: string; onChange: (value: string) => void } & InputHTMLAttributes<HTMLInputElement>) {
  return <label className="grid gap-2 text-sm font-semibold text-zinc-300">{label}<input className="rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-white outline-none ring-ticketGold/60 focus:ring-2" value={value} onChange={(event) => onChange(event.target.value)} {...props} /></label>;
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return <label className="grid gap-2 text-sm font-semibold text-zinc-300">{label}<select className="rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-white outline-none ring-ticketGold/60 focus:ring-2" value={value} onChange={(event) => onChange(event.target.value)}>{options.map((option) => <option key={option} value={option}>{option || "All"}</option>)}</select></label>;
}

function Textarea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="grid gap-2 text-sm font-semibold text-zinc-300">{label}<textarea rows={3} className="rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-white outline-none ring-ticketGold/60 focus:ring-2" value={value} onChange={(event) => onChange(event.target.value)} /></label>;
}

function Output({ title, body }: { title: string; body: string }) {
  return <div><h3 className="text-sm font-bold uppercase tracking-widest text-ticketGold">{title}</h3><p className="mt-1 whitespace-pre-line text-sm leading-6 text-zinc-200">{body}</p></div>;
}
