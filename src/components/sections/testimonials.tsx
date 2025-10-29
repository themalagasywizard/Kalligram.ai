import { Card, CardContent } from "@/components/ui/card";

const testimonials = [
  {
    name: "Alex Thompson",
    quote:
      "The AI suggestions were incredibly intuitive. I drafted three chapters in a weekend.",
  },
  {
    name: "Maria Garcia",
    quote: "Character tools are unlike anything I've used before—game changer.",
  },
  {
    name: "David Chen",
    quote: "The outline-to-draft flow kept me moving. The pacing suggestions are spot on.",
  },
];

export function Testimonials() {
  return (
    <section id="testimonials" className="bg-muted/30 py-20">
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Loved by early testers
          </h2>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t) => (
            <Card key={t.name} className="h-full">
              <CardContent className="p-6">
                <p className="italic text-muted-foreground">“{t.quote}”</p>
                <p className="mt-4 font-medium">{t.name}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
