import { Navbar } from "../components/navbar";
import { Hero } from "../components/hero";

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-[-12rem] top-[-10rem] h-[24rem] w-[24rem] rounded-full bg-accent/20 blur-3xl" />
        <div className="absolute bottom-[-8rem] right-[-10rem] h-[20rem] w-[20rem] rounded-full bg-secondary-accent/20 blur-3xl" />
      </div>

      <Navbar />
      <Hero />
    </main>
  );
}
