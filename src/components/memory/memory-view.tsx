"use client";

import * as React from "react";
import { Plus, Brain, Trash2, Pencil, ShieldCheck, Loader2 } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { PotentialMemoryCard } from "@/components/memory/potential-memory-card";
import { useToast } from "@/components/ui/toast";
import { MEMORY_CATEGORY_LABEL } from "@/lib/utils";
import type { Memory, MemoryCategory, PotentialMemory } from "@/types/database";

const CATEGORIES = Object.keys(MEMORY_CATEGORY_LABEL) as MemoryCategory[];

export function MemoryView({
  initialMemories,
  initialPotential,
}: {
  initialMemories: Memory[];
  initialPotential: PotentialMemory[];
}) {
  const [memories, setMemories] = React.useState(initialMemories);
  const [potential, setPotential] = React.useState(initialPotential);
  const [addOpen, setAddOpen] = React.useState(false);
  const [newCategory, setNewCategory] = React.useState<MemoryCategory>("about_me");
  const [newContent, setNewContent] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [editingMemory, setEditingMemory] = React.useState<Memory | null>(null);
  const [confirmingDeleteAll, setConfirmingDeleteAll] = React.useState(false);
  const { toast } = useToast();

  function handlePotentialResolved(id: string, approvedMemory?: Memory) {
    setPotential((prev) => prev.filter((p) => p.id !== id));
    if (approvedMemory) {
      setMemories((prev) => [approvedMemory, ...prev]);
      toast("Memory saved.");
    } else {
      toast("Suggestion dismissed.");
    }
  }

  async function handleAdd() {
    if (!newContent.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/memories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: newCategory, content: newContent }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMemories((prev) => [data.memory, ...prev]);
      setNewContent("");
      setAddOpen(false);
      toast("Memory added.");
    } catch {
      toast("Couldn't save that memory.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateMemory(memory: Memory, content: string, category: MemoryCategory) {
    const res = await fetch(`/api/memories/${memory.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, category }),
    });
    const data = await res.json();
    if (res.ok) {
      setMemories((prev) => prev.map((m) => (m.id === memory.id ? data.memory : m)));
      setEditingMemory(null);
      toast("Memory updated.");
    }
  }

  async function handleDelete(id: string) {
    const prev = memories;
    setMemories((m) => m.filter((mem) => mem.id !== id));
    const res = await fetch(`/api/memories/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setMemories(prev);
      toast("Couldn't delete that memory.", "error");
    }
  }

  async function handleDeleteAll() {
    const res = await fetch("/api/memories/delete-all", { method: "DELETE" });
    if (res.ok) {
      setMemories([]);
      toast("All memories deleted.");
    }
    setConfirmingDeleteAll(false);
  }

  const grouped = CATEGORIES.map((cat) => ({
    category: cat,
    items: memories.filter((m) => m.category === cat),
  })).filter((g) => g.items.length > 0);

  return (
    <PageContainer>
      <PageHeader
        title="Memory"
        description="What Buddy remembers"
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setConfirmingDeleteAll(true)} disabled={memories.length === 0} className="gap-1.5">
              <Trash2 className="h-4 w-4" /> Delete all
            </Button>
            <Button size="sm" onClick={() => setAddOpen(true)} className="gap-1.5">
              <Plus className="h-4 w-4" /> Add memory
            </Button>
          </div>
        }
      />

      <div className="mb-6 flex items-start gap-3 rounded-xl2 border border-ink-100 bg-white p-4 text-sm text-ink-500 shadow-soft dark:border-ink-800 dark:bg-ink-900">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-sage-500" />
        <p>
          HelloBuddy uses information you choose to save to provide more relevant conversations.
          You remain in control — edit or delete anything below at any time.
        </p>
      </div>

      {potential.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-500">
            Suggested memories awaiting your review ({potential.length})
          </h2>
          <div className="space-y-3">
            {potential.map((p) => (
              <PotentialMemoryCard key={p.id} memory={p} onResolved={handlePotentialResolved} />
            ))}
          </div>
        </div>
      )}

      {memories.length === 0 ? (
        <EmptyState
          icon={<Brain className="h-10 w-10" />}
          title="Nothing saved yet"
          description="As you talk with Buddy, journal, or import your story, you'll be asked to approve memories worth remembering."
          action={
            <Button onClick={() => setAddOpen(true)} className="gap-1.5">
              <Plus className="h-4 w-4" /> Add your first memory
            </Button>
          }
        />
      ) : (
        <div className="space-y-8">
          {grouped.map((group) => (
            <div key={group.category}>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-500">
                {MEMORY_CATEGORY_LABEL[group.category]}
              </h2>
              <div className="space-y-3">
                {group.items.map((memory) =>
                  editingMemory?.id === memory.id ? (
                    <EditableMemoryRow
                      key={memory.id}
                      memory={memory}
                      onCancel={() => setEditingMemory(null)}
                      onSave={handleUpdateMemory}
                    />
                  ) : (
                    <Card key={memory.id}>
                      <CardContent className="flex items-start justify-between gap-3 p-4">
                        <p className="text-sm text-ink-700 dark:text-ink-200">{memory.content}</p>
                        <div className="flex shrink-0 gap-1">
                          <button onClick={() => setEditingMemory(memory)} className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => handleDelete(memory.id)} className="rounded-lg p-1.5 text-ink-400 hover:bg-red-50 hover:text-red-600">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={addOpen} onClose={() => setAddOpen(false)} title="Add a memory">
        <div className="space-y-3">
          <Select value={newCategory} onChange={(e) => setNewCategory(e.target.value as MemoryCategory)}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {MEMORY_CATEGORY_LABEL[c]}
              </option>
            ))}
          </Select>
          <Textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="e.g. I'm training for a half marathon in October."
            rows={3}
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={saving || !newContent.trim()}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save
            </Button>
          </div>
        </div>
      </Dialog>

      <Dialog
        open={confirmingDeleteAll}
        onClose={() => setConfirmingDeleteAll(false)}
        title="Delete all memories?"
        description="This permanently removes everything HelloBuddy remembers about you. This can't be undone."
      >
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirmingDeleteAll(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDeleteAll}>
            Yes, delete everything
          </Button>
        </div>
      </Dialog>
    </PageContainer>
  );
}

function EditableMemoryRow({
  memory,
  onCancel,
  onSave,
}: {
  memory: Memory;
  onCancel: () => void;
  onSave: (memory: Memory, content: string, category: MemoryCategory) => void;
}) {
  const [content, setContent] = React.useState(memory.content);
  const [category, setCategory] = React.useState(memory.category);

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <Select value={category} onChange={(e) => setCategory(e.target.value as MemoryCategory)} className="h-9 text-xs">
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {MEMORY_CATEGORY_LABEL[c]}
            </option>
          ))}
        </Select>
        <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={2} />
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button size="sm" onClick={() => onSave(memory, content, category)}>
            Save
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
