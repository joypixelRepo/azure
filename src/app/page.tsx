import { ExperienceProvider } from "@/components/providers/Experience";
import { Nav } from "@/components/layout/Nav";
import { Footer } from "@/components/layout/Footer";
import { Cinematic } from "@/components/sections/Cinematic";
import { Design } from "@/components/sections/Design";
import { OnBoard } from "@/components/sections/OnBoard";
import { Experience } from "@/components/sections/Experience";
import { Cabins } from "@/components/sections/Cabins";
import { Craft } from "@/components/sections/Craft";
import { Specs } from "@/components/sections/Specs";
import { Crew } from "@/components/sections/Crew";
import { Testimonials } from "@/components/sections/Testimonials";
import { Closing } from "@/components/sections/Closing";
import { Booking } from "@/components/sections/Booking";

export default function Home() {
  return (
    <ExperienceProvider>
      <Nav />
      <main>
        <Cinematic />
        <Design />
        <OnBoard />
        <Experience />
        <Cabins />
        <Craft />
        <Testimonials />
        <Specs />
        <Crew />
        <Closing />
        <Booking />
      </main>
      <Footer />
    </ExperienceProvider>
  );
}
