import { Button } from "@/components/ui/button";

export function Cta() {
  return (
    <section className="bg-gradient-to-r from-indigo-600 to-purple-600 py-20 text-white">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          Ready to start your manuscript?
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-white/90">
          Join the waitlist to get early access and launch perks.
        </p>
        <div className="mt-8 flex justify-center">
          <Button size="lg" variant="secondary">
            Join waitlist
          </Button>
        </div>
      </div>
    </section>
  );
}
