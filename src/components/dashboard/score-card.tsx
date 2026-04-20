import { Card, CardContent } from "@/components/ui/card";

interface ScoreCardProps {
  score: number;
  total: number;
  met: number;
  overdue: number;
}

export function ScoreCard({ score, total, met, overdue }: ScoreCardProps) {
  const tone =
    score >= 80
      ? "text-chart-1"
      : score >= 50
        ? "text-chart-3"
        : "text-destructive";

  return (
    <Card className="py-0">
      <CardContent className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-5">
          <div className="relative flex size-20 shrink-0 items-center justify-center rounded-full border-4 border-primary/20">
            <div
              className="absolute inset-0 rounded-full border-4 border-transparent"
              style={{
                borderTopColor: "var(--color-primary)",
                transform: `rotate(${(score / 100) * 360}deg)`,
                transition: "transform 0.6s",
              }}
            />
            <span className={`font-heading text-2xl font-bold ${tone}`}>
              {score}
            </span>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Compliance score
            </p>
            <p className="font-heading text-xl font-semibold">
              {met} of {total} obligations met
            </p>
            {overdue > 0 && (
              <p className="text-sm text-destructive">
                {overdue} overdue — action required
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
