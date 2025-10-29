import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function Hero() {
  return (
    <section className="relative overflow-hidden min-h-screen flex items-center">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(72rem_32rem_at_50%_-2rem,oklch(0.97_0_0),transparent)] dark:bg-[radial-gradient(72rem_32rem_at_50%_-2rem,oklch(0.27_0_0),transparent)]" />
      <div className="container mx-auto grid gap-10 px-4 py-20 lg:grid-cols-2 lg:items-center">
        <div className="space-y-6">
          <Badge className="rounded-full" variant="secondary">AI-Powered Book Writing Assistant</Badge>
          <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
            Write your book with intelligence—and your voice
          </h1>
          <p className="text-pretty text-lg text-muted-foreground">
            Kalligram helps you craft compelling stories, outlines, and characters while staying true to your style.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button size="lg">Join waitlist</Button>
            <Button size="lg" variant="outline">See how it works</Button>
          </div>
          <div className="flex gap-6 pt-2 text-sm text-muted-foreground">
            <span>No credit card</span>
            <span>•</span>
            <span>Early access perks</span>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-2 shadow-sm">
          <div className="aspect-video w-full rounded-lg bg-gradient-to-br from-indigo-500/10 to-purple-500/10 p-6">
            <div className="h-full w-full rounded-md border bg-background p-4">
              <div className="h-full rounded-md border bg-muted" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
