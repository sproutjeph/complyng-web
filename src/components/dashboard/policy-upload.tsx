"use client";

import { useRef, useState, useTransition } from "react";
import { Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { uploadPolicy } from "@/app/dashboard/policies/actions";

export function PolicyUpload() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function onFileChosen(file: File) {
    setError(null);
    const fd = new FormData();
    fd.set("file", file);
    startTransition(async () => {
      try {
        await uploadPolicy(fd);
      } catch (e) {
        if (e instanceof Error && e.message.includes("NEXT_REDIRECT")) return;
        setError(e instanceof Error ? e.message : "Upload failed");
      }
    });
  }

  return (
    <div className="rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center">
      <Upload className="mx-auto size-8 text-muted-foreground" />
      <h3 className="mt-3 font-heading text-base font-semibold">
        Upload a privacy policy
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">
        PDF, Markdown or TXT up to 10MB. Claude will compare it against GAID 2025 and surface gaps with citations.
      </p>
      <div className="mt-4 flex justify-center">
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.md,.markdown,.txt,application/pdf,text/markdown,text/plain"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFileChosen(f);
          }}
        />
        <Button
          type="button"
          disabled={pending}
          onClick={() => inputRef.current?.click()}
        >
          {pending ? (
            <>
              <Loader2 className="animate-spin" />
              Processing…
            </>
          ) : (
            <>
              <Upload />
              Choose file
            </>
          )}
        </Button>
      </div>
      {error && (
        <p className="mt-3 text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
