import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pencil, Bot, Users } from "lucide-react";

const features = [
  {
    icon: Pencil,
    title: "Story engine",
    desc: "Generate outlines, scenes, and chapters that fit your narrative arc.",
  },
  {
    icon: Bot,
    title: "Style-aware AI",
    desc: "The model adapts to your tone and vocabulary for consistent voice.",
  },
  {
    icon: Users,
    title: "Collaboration",
    desc: "Invite co-authors and beta readers with roles and comments.",
  },
];

export function Features() {
  return (
    <section id="features" className="py-20">
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <Badge variant="secondary">Features</Badge>
          <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Everything you need to go from idea to manuscript
          </h2>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <Card key={f.title} className="h-full">
              <CardHeader>
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <f.icon className="h-5 w-5" />
                </div>
                <CardTitle className="mt-4 text-xl">{f.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">{f.desc}</CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
