import { FileText, Link2, StickyNote, Trash2, Paperclip, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { EvidenceRow } from "@/lib/db/evidence";
import {
  attachFileEvidence,
  attachLinkEvidence,
  removeEvidence,
} from "@/app/dashboard/evidence/actions";

function evidenceIcon(kind: EvidenceRow["kind"]) {
  if (kind === "file") return FileText;
  if (kind === "link") return Link2;
  return StickyNote;
}

export function EvidenceDrawer({
  code,
  evidence,
}: {
  code: string;
  evidence: readonly EvidenceRow[];
}) {
  return (
    <details className="group/ev mt-2">
      <summary className="inline-flex cursor-pointer select-none items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <Paperclip className="size-3" />
        Evidence ({evidence.length})
      </summary>
      <div className="mt-3 space-y-3 rounded-md border border-border/60 bg-muted/20 p-3">
        {evidence.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No evidence attached yet. Upload a file or add a verification link below to mark this obligation as met.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {evidence.map((e) => {
              const Icon = evidenceIcon(e.kind);
              return (
                <li
                  key={e.id}
                  className="flex items-start gap-2 rounded border border-border/40 bg-background p-2 text-xs"
                >
                  <Icon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    {e.kind === "file" && (
                      <>
                        <p className="truncate font-medium">{e.filename}</p>
                        <p className="text-[0.65rem] text-muted-foreground">
                          sha256 <span className="font-mono">{e.sha256?.slice(0, 16) ?? "-"}…</span> · {new Date(e.uploadedAt).toLocaleDateString()}
                        </p>
                      </>
                    )}
                    {e.kind === "link" && e.url && (
                      <>
                        <a
                          href={e.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-medium hover:underline"
                        >
                          <span className="truncate max-w-[280px]">{e.url}</span>
                          <ExternalLink className="size-3 shrink-0" />
                        </a>
                        <p className="text-[0.65rem] text-muted-foreground">
                          {new Date(e.uploadedAt).toLocaleDateString()}
                        </p>
                      </>
                    )}
                    {e.note && (
                      <p className="mt-1 text-muted-foreground">{e.note}</p>
                    )}
                  </div>
                  <form action={removeEvidence}>
                    <input type="hidden" name="id" value={e.id} />
                    <button
                      type="submit"
                      aria-label="Remove evidence"
                      className="text-muted-foreground transition-colors hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </form>
                </li>
              );
            })}
          </ul>
        )}

        <form action={attachFileEvidence} className="space-y-2">
          <input type="hidden" name="code" value={code} />
          <label className="block text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground">
            Upload file (PDF, PNG, CSV, JSON, MD, TXT; max 10MB)
          </label>
          <input
            type="file"
            name="file"
            required
            accept=".pdf,.png,.jpg,.jpeg,.md,.txt,.csv,.json"
            className="block w-full text-xs file:mr-2 file:rounded file:border-0 file:bg-primary/10 file:px-2 file:py-1 file:text-xs file:font-medium file:text-primary hover:file:bg-primary/20"
          />
          <input
            type="text"
            name="note"
            placeholder="Optional note for auditor"
            className="w-full rounded border border-border bg-background px-2 py-1 text-xs"
          />
          <Button type="submit" size="xs" variant="secondary">
            Attach file
          </Button>
        </form>

        <form action={attachLinkEvidence} className="space-y-2">
          <input type="hidden" name="code" value={code} />
          <label className="block text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground">
            Or cite a verification URL
          </label>
          <input
            type="url"
            name="url"
            required
            placeholder="https://ndpc.gov.ng/receipts/..."
            className="w-full rounded border border-border bg-background px-2 py-1 text-xs"
          />
          <input
            type="text"
            name="note"
            placeholder="Optional note"
            className="w-full rounded border border-border bg-background px-2 py-1 text-xs"
          />
          <Button type="submit" size="xs" variant="secondary">
            Attach link
          </Button>
        </form>
      </div>
    </details>
  );
}
