import { Hero } from "@/components/sections/hero";
import { Features } from "@/components/sections/features";
import { Testimonials } from "@/components/sections/testimonials";
import { Cta } from "@/components/sections/cta";

export default function Home() {
  return (
    <main>
      <Hero />
      <Features />
      <Testimonials />
      <Cta />
    </main>
  );
}
