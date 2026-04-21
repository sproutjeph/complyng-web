"use client";

import { useFormStatus } from "react-dom";
import { Loader2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

export function GapAnalysisButton({ hasExistingGaps }: { hasExistingGaps: boolean }) {
  const { pending } = useFormStatus();
  return (
    <>
      <Button type="submit" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : <Play />}
        {pending
          ? "Analysing…"
          : hasExistingGaps
            ? "Re-run gap analysis"
            : "Run gap analysis"}
      </Button>
      <span aria-live="polite" className="sr-only">
        {pending ? "Gap analysis is running. This can take up to 30 seconds." : ""}
      </span>
    </>
  );
}
