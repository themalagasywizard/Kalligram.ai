import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export default function WaitlistPage() {
  return (
    <main className="container mx-auto max-w-2xl px-4 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Join the waitlist</h1>
      <p className="mt-2 text-muted-foreground">
        Be first to know when Kalligram launches. We’ll email only important updates.
      </p>
      <form className="mt-8 grid gap-4">
        <div>
          <label className="mb-2 block text-sm font-medium">Email</label>
          <Input type="email" placeholder="you@example.com" required />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium">What are you writing?</label>
          <Textarea placeholder="Tell us about your project (optional)" rows={4} />
        </div>
        <Button type="submit" size="lg">Join</Button>
      </form>
    </main>
  );
}
