"use client";

import * as React from "react";
import { Check, X, Pencil, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MEMORY_CATEGORY_LABEL } from "@/lib/utils";
import type { Memory, MemoryCategory, PotentialMemory } from "@/types/database";

export function PotentialMemoryCard({
  memory,
  onResolved,
}: {
  memory: PotentialMemory;
  onResolved: (id: string, approved?: Memory) => void;
}) {
  const [editing, setEditing] = React.useState(false);
  const [content, setContent] = React.useState(memory.content);
  const [category, setCategory] = React.useState<MemoryCategory>(memory.category);
  const [loading, setLoading] = React.useState<"approve" | "reject" | null>(null);

  async function act(action: "approve" | "reject") {
    setLoading(action);
    try {
      const res = await fetch(`/api/memories/potential/${memory.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          action === "approve" ? { action, category, content } : { action }
        ),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onResolved(memory.id, data.memory);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="rounded-xl border border-clay-200 bg-clay-50/60 p-4">
      <div className="mb-2 flex items-center justify-between">
        <Badge variant="clay">{MEMORY_CATEGORY_LABEL[category]}</Badge>
        <span className="text-xs text-ink-400 capitalize">{memory.source.replace("_", " ")}</span>
      </div>

      {editing ? (
        <div className="space-y-2">
          <Select value={category} onChange={(e) => setCategory(e.target.value as MemoryCategory)} className="h-9 text-xs">
            {Object.entries(MEMORY_CATEGORY_LABEL).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </Select>
          <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={3} />
        </div>
      ) : (
        <p className="text-sm text-ink-800">{content}</p>
      )}

      <div className="mt-3 flex items-center gap-2">
        <Button size="sm" onClick={() => act("approve")} disabled={loading !== null} className="gap-1.5">
          {loading === "approve" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
          Approve
        </Button>
        <Button size="sm" variant="outline" onClick={() => setEditing((e) => !e)} disabled={loading !== null} className="gap-1.5">
          <Pencil className="h-3.5 w-3.5" /> {editing ? "Editing" : "Edit"}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => act("reject")} disabled={loading !== null} className="gap-1.5 text-ink-500">
          {loading === "reject" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
          Reject
        </Button>
      </div>
    </div>
  );
}
