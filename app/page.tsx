import Hero from "@/components/Hero";

export default function Home() {
  return <Hero recipientName={process.env.RECIPIENT_NAME || "Someone"} />;
}
