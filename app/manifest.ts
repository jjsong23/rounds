import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Rounds",
    short_name: "Rounds",
    description: "Find people to drink and hang out with, one round at a time.",
    start_url: "/",
    display: "standalone",
    background_color: "#f1eee4",
    theme_color: "#1b2e2c",
    icons: [
      { src: "/icon", sizes: "512x512", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
