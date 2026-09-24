"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";

interface Note {
  id: string;
  title: string;
  content: string;
  company: string | null;
  isBookmarked: boolean;
  createdAt: string;
  updatedAt: string;
}

function groupByCompany(notes: Note[]) {
  const groups: Record<string, Note[]> = {};
  notes.forEach((note) => {
    const company = note.company ?? "未分类";
    if (!groups[company]) groups[company] = [];
    groups[company].push(note);
  });
  return groups;
}

function MobileNoteDetail({
  note,
  onBack,
}: {
  note: Note;
  onBack: () => void;
}) {
  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div
        className="flex items-center gap-3 p-4 border-b shrink-0"
        style={{
          backgroundColor: "var(--surface-lowest)",
          borderColor: "var(--outline-variant)",
        }}
      >
        <button
          onClick={onBack}
          className="w-9 h-9 flex items-center justify-center rounded-full"
          style={{ backgroundColor: "var(--surface-high)" }}
        >
          <svg
            className="w-5 h-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <h1
          className="text-base font-semibold truncate"
          style={{ color: "var(--on-surface)" }}
        >
          {note.title}
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {note.company && (
          <span
            className="inline-block px-2 py-1 text-xs font-medium rounded mb-3"
            style={{
              backgroundColor: "var(--surface-high)",
              color: "var(--on-surface-variant)",
            }}
          >
            {note.company}
          </span>
        )}
        <MarkdownRenderer content={note.content || "暂无内容"} />
      </div>
    </div>
  );
}

export default function ExperiencesPage() {
  return (
    <AuthGuard>
      <ExperiencesPageContent />
    </AuthGuard>
  );
}

function ExperiencesPageContent() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState<"split" | "preview">("split");
  const [expandedCompanies, setExpandedCompanies] = useState<Set<string>>(new Set());
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<string>("");
  const titleInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { confirm, dialog } = useConfirmDialog();

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/notes");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const typedData = (Array.isArray(data) ? data : data.notes ?? []) as Note[];
      setNotes(typedData);
      if (typedData.length > 0) {
        setSelectedNote(typedData[0]);
        setSelectedId(typedData[0].id);
      }
      const companies = [...new Set(typedData.map((n) => n.company ?? "未分类"))];
      setExpandedCompanies(new Set(companies));
    } catch (err) {
      console.error("Failed to fetch notes:", err);
      setError(err instanceof Error ? err.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const debouncedSave = useCallback(async (noteId: string, title: string, content: string) => {
    const currentContent = `${title}::${content}`;
    if (currentContent === lastSavedRef.current) return;

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(async () => {
      setSaveStatus('saving');
      try {
        const response = await fetch(`/api/notes/${noteId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, content }),
        });

        if (!response.ok) throw new Error('Save failed');

        lastSavedRef.current = currentContent;
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (error) {
        console.error('Auto-save error:', error);
        setSaveStatus('idle');
      }
    }, 1000);
  }, []);

  const groups = groupByCompany(notes);

  const toggleCompany = (company: string) => {
    setExpandedCompanies((prev) => {
      const next = new Set(prev);
      if (next.has(company)) next.delete(company);
      else next.add(company);
      return next;
    });
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-56px)] overflow-hidden">
      {selectedId ? (
        <MobileNoteDetail
          note={notes.find((n) => n.id === selectedId)!}
          onBack={() => setSelectedId(null)}
        />
      ) : (
        <>
          <div className="flex flex-1 overflow-hidden">
            <aside
          className="w-[260px] lg:w-[260px] shrink-0 flex flex-col border-r overflow-hidden flex-1 lg:flex-none"
          style={{ backgroundColor: "var(--surface-lowest)", borderColor: "var(--outline-variant)" }}
        >
          <div className="p-4 border-b" style={{ borderColor: "var(--outline-variant)" }}>
            <div className="flex justify-between items-center mb-4">
              <h1 className="font-semibold" style={{ color: "var(--on-surface)" }}>面经笔记</h1>
              <span
                className="text-xs px-2 py-0.5 rounded"
                style={{ backgroundColor: "var(--surface-variant)", color: "var(--on-surface-variant)" }}
              >
                {notes.length}
              </span>
            </div>
            <Button
              variant="secondary"
              size="sm"
              className="w-full"
              onClick={async () => {
                try {
                  const response = await fetch('/api/notes', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title: '未命名笔记', content: '' }),
                  });
                  if (!response.ok) throw new Error('Failed to create note');
                  const newNote = await response.json();
                  setNotes((prev) => [newNote, ...prev]);
                  setSelectedNote(newNote);
                  setSelectedId(newNote.id);
                  lastSavedRef.current = `${newNote.title}::${newNote.content}`;
                  setTimeout(() => titleInputRef.current?.focus(), 100);
                } catch (error) {
                  console.error('Create note error:', error);
                }
              }}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14" />
              </svg>
              新增笔记
            </Button>
          </div>

          <div className="px-3 py-2 border-b flex items-center" style={{ borderColor: "var(--outline-variant)" }}>
            <svg
              className="absolute left-6 top-auto w-4 h-4"
              style={{ position: "absolute", left: "28px", opacity: 0.6 }}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              className="w-full bg-surface-lowest border border-outline-variant text-on-surface text-xs py-1 pl-7 pr-2 rounded focus:border-primary focus:ring-1 focus:outline-none transition-all"
              placeholder="过滤笔记..."
              style={{
                backgroundColor: "var(--surface-high)",
                borderColor: "var(--outline-variant)",
                color: "var(--on-surface)",
              }}
            />
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {loading ? (
              /* ── Loading: Notes list skeleton ──────────── */
              <div className="space-y-2 px-2 py-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="py-2 animate-pulse">
                    <div
                      className="h-3 w-3/5 rounded mb-2"
                      style={{ backgroundColor: "var(--surface-highest)" }}
                    />
                    <div
                      className="h-2 w-2/5 rounded"
                      style={{ backgroundColor: "var(--surface-highest)" }}
                    />
                  </div>
                ))}
              </div>
            ) : error ? (
              /* ── Error ────────────────────────────────── */
              <div className="flex flex-col items-center justify-center p-6 text-center">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
                  style={{ backgroundColor: "var(--error-container)" }}
                >
                  <svg
                    className="w-6 h-6"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--error)"
                    strokeWidth="1.5"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>
                <p
                  className="text-sm mb-2 font-medium"
                  style={{ color: "var(--on-surface)" }}
                >
                  加载失败
                </p>
                <p
                  className="text-xs mb-4"
                  style={{ color: "var(--on-surface-variant)" }}
                >
                  {error}
                </p>
                <Button variant="secondary" size="sm" onClick={fetchNotes}>
                  重试
                </Button>
              </div>
            ) : notes.length === 0 ? (
              /* ── Empty notes list ────────────────────── */
              <div className="flex flex-col items-center justify-center p-6 text-center">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                  style={{ backgroundColor: "var(--surface-high)" }}
                >
                  <svg
                    className="w-8 h-8"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--on-surface-variant)"
                    strokeWidth="1.5"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <line x1="10" y1="9" x2="8" y2="9" />
                  </svg>
                </div>
                <p
                  className="text-sm font-medium mb-1"
                  style={{ color: "var(--on-surface)" }}
                >
                  还没有任何笔记
                </p>
                <p
                  className="text-xs mb-4 max-w-[180px]"
                  style={{ color: "var(--on-surface-variant)" }}
                >
                  记录你的面试经验，便于总结回顾
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/notes', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ title: '未命名笔记', content: '' }),
                      });
                      if (!response.ok) throw new Error('Failed to create note');
                      const newNote = await response.json();
                      setNotes((prev) => [newNote, ...prev]);
                      setSelectedNote(newNote);
                      setSelectedId(newNote.id);
                      lastSavedRef.current = `${newNote.title}::${newNote.content}`;
                    } catch (e) {
                      console.error(e);
                    }
                  }}
                >
                  创建第一篇笔记
                </Button>
              </div>
            ) : (
              /* ── Notes list ───────────────────────────── */
              <div className="space-y-4">
                <div className="flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-colors"
                  style={{ color: "var(--on-surface-variant)" }}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                  </svg>
                  <span className="text-[13px] font-medium" style={{ color: "var(--on-surface)" }}>全部笔记</span>
                </div>

                {Object.entries(groups).map(([company, companyNotes]) => (
                  <div key={company}>
                    <div
                      onClick={() => toggleCompany(company)}
                      className="flex items-center gap-1 text-[11px] uppercase font-bold px-2 mb-1 group cursor-pointer"
                      style={{ color: "var(--on-surface-variant)" }}
                    >
                      <svg
                        className="w-3.5 h-3.5 transition-transform"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        style={{
                          transform: expandedCompanies.has(company) ? "rotate(0deg)" : "rotate(-90deg)",
                        }}
                      >
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                      <span>{company} ({companyNotes.length})</span>
                    </div>
                    {expandedCompanies.has(company) && (
                      <div className="space-y-0.5">
                        {companyNotes.map((note) => {
                          const isActive = selectedNote?.id === note.id;
                          return (
                            <div
                              key={note.id}
                              onClick={() => {
                                setSelectedNote(note);
                                setSelectedId(note.id);
                              }}
                              className="px-3 py-1.5 rounded cursor-pointer group flex flex-col gap-1 relative overflow-hidden transition-colors"
                              style={{
                                backgroundColor: isActive ? "var(--surface-variant)" : "transparent",
                              }}
                            >
                              {isActive && (
                                <div
                                  className="absolute left-0 top-0 bottom-0 w-0.5"
                                  style={{ backgroundColor: "var(--primary)" }}
                                />
                              )}
                              <span
                                className="text-[13px] font-medium truncate pl-1"
                                style={{ color: isActive ? "var(--primary)" : "var(--on-surface)" }}
                              >
                                {note.title}
                              </span>
                              <span
                                className="text-[10px] pl-1"
                                style={{ color: "var(--on-surface-variant)" }}
                              >
                                {new Date(note.createdAt).toLocaleDateString("zh-CN")}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>

        <main
          className="hidden lg:flex flex-1 flex flex-col overflow-hidden"
          style={{ backgroundColor: "var(--background)" }}
        >
          {loading ? (
            /* ── Loading: Content skeleton ──────────────── */
            <div className="flex-1 p-8">
              <div className="max-w-3xl mx-auto space-y-6">
                <div
                  className="h-6 w-1/3 rounded animate-pulse"
                  style={{ backgroundColor: "var(--surface-highest)" }}
                />
                <div
                  className="h-4 w-full rounded animate-pulse"
                  style={{ backgroundColor: "var(--surface-highest)" }}
                />
                <div
                  className="h-4 w-5/6 rounded animate-pulse"
                  style={{ backgroundColor: "var(--surface-highest)" }}
                />
                <div
                  className="h-4 w-4/6 rounded animate-pulse"
                  style={{ backgroundColor: "var(--surface-highest)" }}
                />
                <div
                  className="h-4 w-3/4 rounded animate-pulse"
                  style={{ backgroundColor: "var(--surface-highest)" }}
                />
                <div
                  className="h-4 w-2/3 rounded animate-pulse"
                  style={{ backgroundColor: "var(--surface-highest)" }}
                />
              </div>
            </div>
          ) : error ? (
            /* ── Error in content area ─────────────────── */
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-sm">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                  style={{ backgroundColor: "var(--error-container)" }}
                >
                  <svg
                    className="w-10 h-10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--error)"
                    strokeWidth="1.5"
                  >
                    <path d="M12 9v2m0 4h.01" />
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  </svg>
                </div>
                <h2
                  className="text-xl font-semibold mb-2"
                  style={{ color: "var(--on-surface)" }}
                >
                  无法加载笔记
                </h2>
                <p
                  className="text-sm mb-6"
                  style={{ color: "var(--on-surface-variant)" }}
                >
                  请检查网络连接或稍后重试。<br />
                  <span className="text-xs opacity-70">错误信息：{error}</span>
                </p>
                <Button variant="primary" onClick={fetchNotes}>
                  重新加载
                </Button>
              </div>
            </div>
          ) : notes.length === 0 ? (
            /* ── Empty state ───────────────────────────── */
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-md">
                <div
                  className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6"
                  style={{ backgroundColor: "var(--surface-high)" }}
                >
                  <svg
                    className="w-12 h-12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--on-surface-variant)"
                    strokeWidth="1.2"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                </div>
                <h2
                  className="text-2xl font-semibold mb-2"
                  style={{ color: "var(--on-surface)" }}
                >
                  开始记录你的面试经验
                </h2>
                <p
                  className="text-sm mb-8"
                  style={{ color: "var(--on-surface-variant)" }}
                >
                  在这里记录每一次面试的问题、心得和反思，<br />
                  让每一次经历都成为成长的财富。
                </p>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/notes', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ title: '未命名笔记', content: '' }),
                      });
                      if (!response.ok) throw new Error('Failed to create note');
                      const newNote = await response.json();
                      setNotes((prev) => [newNote, ...prev]);
                      setSelectedNote(newNote);
                      setSelectedId(newNote.id);
                      lastSavedRef.current = `${newNote.title}::${newNote.content}`;
                    } catch (e) {
                      console.error(e);
                    }
                  }}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  创建第一篇笔记
                </Button>
              </div>
            </div>
          ) : selectedNote ? (
            /* ── Selected note content ────────────────── */
            <>
              <div
                className="h-12 border-b flex justify-between items-center px-4 shrink-0"
                style={{ backgroundColor: "var(--surface-lowest)", borderColor: "var(--outline-variant)" }}
              >
                <div className="flex items-center gap-3">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                    style={{ color: "var(--on-surface-variant)" }}
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  <input
                    ref={titleInputRef}
                    className="bg-transparent border-none font-semibold text-base focus:ring-0 p-0 w-full max-w-[300px] outline-none"
                    style={{ color: "var(--on-surface)" }}
                    value={selectedNote.title}
                    onChange={(e) => {
                      const newTitle = e.target.value;
                      setSelectedNote((prev) => prev ? { ...prev, title: newTitle } : prev);
                      setNotes((prev) =>
                        prev.map((n) =>
                          n.id === selectedNote.id ? { ...n, title: newTitle } : n
                        )
                      );
                      debouncedSave(selectedNote.id, newTitle, selectedNote.content);
                    }}
                  />
                  <span
                    className="px-1.5 py-0.5 rounded text-[10px] uppercase border"
                    style={{
                      backgroundColor: saveStatus === 'saved' ? "var(--success-container)" : "var(--surface-variant)",
                      color: saveStatus === 'saved' ? "var(--success)" : "var(--on-surface-variant)",
                      borderColor: "var(--outline-variant)",
                    }}
                  >
                    {saveStatus === 'saving' ? '保存中...' : saveStatus === 'saved' ? '已保存' : '未保存'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="w-8 h-8 flex items-center justify-center rounded transition-colors"
                    style={{
                      color: "var(--on-surface-variant)",
                      backgroundColor: "transparent",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "var(--surface-variant)";
                      e.currentTarget.style.color = "var(--on-surface)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.style.color = "var(--on-surface-variant)";
                    }}
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  </button>
                  <div
                    className="flex rounded p-0.5 border mx-2"
                    style={{ backgroundColor: "var(--surface-highest)", borderColor: "var(--outline-variant)" }}
                  >
                    <button
                      onClick={() => setEditMode("split")}
                      className={`px-3 py-1 rounded-sm text-[12px] font-medium transition-colors`}
                      style={{
                        backgroundColor: editMode === "split" ? "var(--surface-variant)" : "transparent",
                        color: editMode === "split" ? "var(--on-surface)" : "var(--on-surface-variant)",
                      }}
                    >
                      Split
                    </button>
                    <button
                      onClick={() => setEditMode("preview")}
                      className={`px-3 py-1 rounded-sm text-[12px] transition-colors`}
                      style={{
                        backgroundColor: editMode === "preview" ? "var(--surface-variant)" : "transparent",
                        color: editMode === "preview" ? "var(--on-surface)" : "var(--on-surface-variant)",
                      }}
                    >
                      Preview
                    </button>
                  </div>
                  <button
                    className="w-8 h-8 flex items-center justify-center rounded transition-colors"
                    style={{ color: "var(--on-surface-variant)" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "var(--error-container)";
                      e.currentTarget.style.color = "var(--error)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.style.color = "var(--on-surface-variant)";
                    }}
                    onClick={async () => {
                      if (!selectedNote) return;
                      const confirmed = await confirm({ title: '删除笔记', message: '确定要删除这篇笔记吗？', confirmText: '删除', danger: true });
                      if (!confirmed) return;
                      try {
                        const response = await fetch(`/api/notes/${selectedNote.id}`, {
                          method: 'DELETE',
                        });
                        if (!response.ok) throw new Error('Failed to delete note');
                        setNotes((prev) => prev.filter((n) => n.id !== selectedNote.id));
                        const remainingNotes = notes.filter((n) => n.id !== selectedNote.id);
                        if (remainingNotes.length > 0) {
                          const currentIndex = notes.findIndex((n) => n.id === selectedNote.id);
                          const nextIndex = Math.min(currentIndex, remainingNotes.length - 1);
                          const nextNote = remainingNotes[nextIndex];
                          setSelectedNote(nextNote);
                          setSelectedId(nextNote.id);
                          lastSavedRef.current = `${nextNote.title}::${nextNote.content}`;
                        } else {
                          setSelectedNote(null);
                          setSelectedId(null);
                        }
                        setSaveStatus('idle');
                      } catch (e) {
                        console.error(e);
                      }
                    }}
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="flex-1 flex overflow-hidden">
                <div
                  className="flex-1 flex flex-col overflow-hidden"
                  style={{ borderRight: editMode === "split" ? "1px solid var(--outline-variant)" : "none" }}
                >
                  <div className="flex-1 overflow-y-auto p-4">
                    <textarea
                      className="w-full h-full bg-transparent border-none font-mono text-sm resize-none focus:ring-0 p-0 leading-relaxed outline-none"
                      style={{ color: "var(--on-surface)" }}
                      spellCheck={false}
                      value={selectedNote.content}
                      onChange={(e) => {
                        const newContent = e.target.value;
                        setSelectedNote((prev) => prev ? { ...prev, content: newContent } : prev);
                        setNotes((prev) =>
                          prev.map((n) =>
                            n.id === selectedNote.id ? { ...n, content: newContent } : n
                          )
                        );
                        debouncedSave(selectedNote.id, selectedNote.title, newContent);
                      }}
                      placeholder="在这里记录你的面试经验、问题和反思...

支持 Markdown 格式：
## 标题
- 列表项
`代码片段`
**加粗**"
                    />
                  </div>
                </div>

                {editMode === "split" && (
                  <div className="flex-1 overflow-y-auto p-4">
                    <MarkdownRenderer content={selectedNote.content || "*暂无内容，开始记录吧...*"} />
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <svg
                  className="w-16 h-16 mx-auto mb-4"
                  style={{ color: "var(--on-surface-variant)" }}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                <p style={{ color: "var(--on-surface-variant)" }}>选择左侧一篇笔记开始阅读</p>
              </div>
            </div>
          )}
        </main>
      </div>
        </>
      )}
      {dialog}
    </div>
  );
}
