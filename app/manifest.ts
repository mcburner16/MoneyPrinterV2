import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Worth the Ticket? Studio Dashboard",
    short_name: "WTT Studio",
    description: "A private content operating system for movie reviews.",
    start_url: "/",
    display: "standalone",
    background_color: "#080607",
    theme_color: "#7f101b"
  };
}
