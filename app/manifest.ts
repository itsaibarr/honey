import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Голубиная почта",
    short_name: "Голуби",
    description: "Письма голубями — letters carried to you, wherever the road takes you.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#3a221d",
    theme_color: "#b3614a",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
