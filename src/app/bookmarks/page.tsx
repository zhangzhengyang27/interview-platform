"use client";

import { useState, useEffect, useCallback } from "react";
import { DifficultyBadge, TagBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatRelativeTime } from "@/lib/utils";
import Link from "next/link";

interface BookmarkFolder {
  id: string;
  name: string;
  icon: string | null;
  sortOrder: number;
  createdAt: string;
  itemCount: number;
}

interface BookmarkQuestion {
  id: string;
  questionId: string;
  addedAt: string;
  note: string | null;
  question: {
    id: string;
    title: string;
    difficulty: string;
    questionType: string;
    tags: { tag: string }[];
    company: string | null;
    categoryId: string | null;
  };
}

interface FolderDetail {
  id: string;
  name: string;
  icon: string | null;
  createdAt: string;
  items: BookmarkQuestion[];
}

export default function BookmarksPage() {
  const [folders, setFolders] = useState<BookmarkFolder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [folderQuestions, setFolderQuestions] = useState<FolderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editFolderName, setEditFolderName] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // 加载收藏夹列表
  const loadFolders = useCallback(async () => {
    try {
      const res = await fetch("/api/bookmarks/folders");
      if (res.ok) {
        const data = await res.json();
        setFolders(data.folders ?? []);

        // 如果没有选中的文件夹，自动选中第一个
        if (data.folders?.length > 0 && !selectedFolderId) {
          setSelectedFolderId(data.folders[0].id);
        }
      }
    } catch (error) {
      console.error("加载收藏夹失败:", error);
    }
  }, [selectedFolderId]);

  // 加载选中文件夹的内容
  const loadFolderQuestions = useCallback(async (folderId: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/bookmarks/folders/${folderId}`);
      if (res.ok) {
        const data = await res.json();
        setFolderQuestions(data);
      }
    } catch (error) {
      console.error("加载收藏内容失败:", error);
    } finally {
      setActionLoading(false);
    }
  }, []);

  // 初始加载
  useEffect(() => {
    const init = async () => {
      await loadFolders();
      setLoading(false);
    };
    init();
  }, [loadFolders]);

  // 当选中文件夹变化时加载内容
  useEffect(() => {
    if (selectedFolderId) {
      loadFolderQuestions(selectedFolderId);
    } else {
      setFolderQuestions(null);
    }
  }, [selectedFolderId, loadFolderQuestions]);

  // 创建新收藏夹
  const createFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      const res = await fetch("/api/bookmarks/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newFolderName.trim() }),
      });

      if (res.ok) {
        const newFolder = await res.json();
        setNewFolderName("");
        setShowNewFolderInput(false);
        await loadFolders();
        setSelectedFolderId(newFolder.id);
      }
    } catch (error) {
      console.error("创建收藏夹失败:", error);
    }
  };

  // 重命名收藏夹
  const renameFolder = async (folderId: string) => {
    if (!editFolderName.trim()) return;

    try {
      const res = await fetch(`/api/bookmarks/folders/${folderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editFolderName.trim() }),
      });

      if (res.ok) {
        setEditingFolderId(null);
        await loadFolders();
      }
    } catch (error) {
      console.error("重命名失败:", error);
    }
  };

  // 删除收藏夹
  const deleteFolder = async (folderId: string) => {
    if (!confirm("确定要删除这个收藏夹吗？里面的所有收藏都会被删除。")) return;

    try {
      const res = await fetch(`/api/bookmarks/folders/${folderId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        if (selectedFolderId === folderId) {
          setSelectedFolderId(null);
          setFolderQuestions(null);
        }
        await loadFolders();
      }
    } catch (error) {
      console.error("删除失败:", error);
    }
  };

  // 移除收藏项
  const removeBookmark = async (folderId: string, questionId: string) => {
    try {
      const res = await fetch(
        `/api/bookmarks/items?folderId=${folderId}&questionId=${questionId}`,
        { method: "DELETE" }
      );

      if (res.ok) {
        // 更新本地状态
        setFolderQuestions((prev) =>
          prev
            ? {
                ...prev,
                items: prev.items.filter((item) => item.questionId !== questionId),
              }
            : prev
        );
        // 刷新列表以更新计数
        await loadFolders();
      }
    } catch (error) {
      console.error("移除收藏失败:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100dvh-56px)]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-on-surface-variant">加载中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100dvh-56px)] p-4 md:p-6">
      {/* 页面标题和新建按钮 */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-on-surface">我的收藏夹</h1>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setShowNewFolderInput(true)}
        >
          <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          新建文件夹
        </Button>
      </div>

      {/* 主内容区域 */}
      <div className="flex flex-col md:flex-row gap-4 md:gap-6">
        {/* 左侧栏：收藏夹列表 */}
        <div className="w-full md:w-64 shrink-0">
          <div
            className="rounded-lg p-3"
            style={{
              backgroundColor: "var(--surface-low)",
              border: "1px solid var(--outline-variant)",
            }}
          >
            {/* 新建文件夹输入框 */}
            {showNewFolderInput && (
              <div className="mb-3 p-2 rounded" style={{ backgroundColor: "var(--surface-container)" }}>
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") createFolder();
                    if (e.key === "Escape") {
                      setShowNewFolderInput(false);
                      setNewFolderName("");
                    }
                  }}
                  placeholder="输入文件夹名称..."
                  autoFocus
                  className="w-full px-2 py-1.5 text-sm bg-transparent border border-outline-variant rounded outline-none focus:border-primary text-on-surface placeholder:text-on-surface-variant"
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={createFolder}
                    disabled={!newFolderName.trim()}
                    className="px-3 py-1 text-xs font-medium rounded transition-colors disabled:opacity-40"
                    style={{ backgroundColor: "var(--primary)", color: "var(--on-primary)" }}
                  >
                    确定
                  </button>
                  <button
                    onClick={() => {
                      setShowNewFolderInput(false);
                      setNewFolderName("");
                    }}
                    className="px-3 py-1 text-xs font-medium rounded transition-colors hover:bg-surface-high"
                  >
                    取消
                  </button>
                </div>
              </div>
            )}

            {/* 文件夹列表 */}
            <div className="space-y-1">
              {folders.length === 0 ? (
                <p className="text-sm text-on-surface-variant text-center py-4">
                  暂无收藏夹，点击上方按钮创建
                </p>
              ) : (
                folders.map((folder) => (
                  <div key={folder.id}>
                    {editingFolderId === folder.id ? (
                      // 编辑模式
                      <div className="p-2 rounded" style={{ backgroundColor: "var(--surface-container)" }}>
                        <input
                          type="text"
                          value={editFolderName}
                          onChange={(e) => setEditFolderName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") renameFolder(folder.id);
                            if (e.key === "Escape") setEditingFolderId(null);
                          }}
                          autoFocus
                          className="w-full px-2 py-1 text-sm bg-transparent border border-outline-variant rounded outline-none focus:border-primary text-on-surface"
                        />
                        <div className="flex gap-2 mt-1.5">
                          <button
                            onClick={() => renameFolder(folder.id)}
                            className="px-2 py-0.5 text-xs rounded"
                            style={{ backgroundColor: "var(--primary)", color: "var(--on-primary)" }}
                          >
                            确定
                          </button>
                          <button
                            onClick={() => setEditingFolderId(null)}
                            className="px-2 py-0.5 text-xs rounded hover:bg-surface-high"
                          >
                            取消
                          </button>
                        </div>
                      </div>
                    ) : (
                      // 正常显示
                      <button
                        onClick={() => setSelectedFolderId(folder.id)}
                        className={`w-full flex items-center gap-2 p-2 rounded-lg text-left transition-colors group ${
                          selectedFolderId === folder.id ? "font-medium" : ""
                        }`}
                        style={{
                          backgroundColor:
                            selectedFolderId === folder.id
                              ? "var(--surface-high)"
                              : "transparent",
                        }}
                      >
                        {/* 图标 */}
                        <span className="text-lg shrink-0">{folder.icon ?? "📁"}</span>

                        {/* 名称 */}
                        <span className="flex-1 truncate text-sm text-on-surface">
                          {folder.name}
                        </span>

                        {/* 数量 badge */}
                        <span
                          className="shrink-0 px-1.5 py-0.5 rounded text-[11px] font-mono"
                          style={{
                            backgroundColor: "var(--surface-container)",
                            color: "var(--on-surface-variant)",
                          }}
                        >
                          {folder.itemCount}
                        </span>

                        {/* 操作菜单（桌面 hover 显示，触屏恒显） */}
                        <div className="shrink-0 max-sm:opacity-100 opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingFolderId(folder.id);
                              setEditFolderName(folder.name);
                            }}
                            className="p-1 rounded hover:bg-surface-container transition-colors"
                            title="重命名"
                          >
                            <svg className="w-3.5 h-3.5 text-on-surface-variant" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteFolder(folder.id);
                            }}
                            className="p-1 rounded hover:bg-error-container transition-colors"
                            title="删除"
                          >
                            <svg className="w-3.5 h-3.5 text-error" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                          </button>
                        </div>
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* 右侧栏：选中文件夹的内容 */}
        <div className="flex-1 min-w-0">
          {!selectedFolderId || !folderQuestions ? (
            // 未选择文件夹或加载中
            <div
              className="rounded-lg p-8 flex flex-col items-center justify-center min-h-[300px]"
              style={{
                backgroundColor: "var(--surface-low)",
                border: "1px solid var(--outline-variant)",
              }}
            >
              <svg
                className="w-16 h-16 text-on-surface-variant mb-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
              >
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
              <p className="text-on-surface-variant text-sm">
                {folders.length === 0
                  ? "请先创建一个收藏夹"
                  : "选择左侧的收藏夹查看内容"}
              </p>
            </div>
          ) : (
            // 显示文件夹内容
            <div
              className="rounded-lg p-4 md:p-6"
              style={{
                backgroundColor: "var(--surface-low)",
                border: "1px solid var(--outline-variant)",
              }}
            >
              {/* 标题栏 */}
              <div className="flex items-center gap-3 mb-4 pb-3" style={{ borderBottom: "1px solid var(--outline-variant)" }}>
                <span className="text-xl">{folderQuestions.icon ?? "📁"}</span>
                <h2 className="text-lg font-semibold text-on-surface">
                  {folderQuestions.name}
                </h2>
                <span
                  className="px-2 py-0.5 rounded text-[11px] font-mono"
                  style={{
                    backgroundColor: "var(--surface-container)",
                    color: "var(--on-surface-variant)",
                  }}
                >
                  {folderQuestions.items.length} 道题
                </span>
              </div>

              {/* 题目卡片网格 */}
              {actionLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : folderQuestions.items.length === 0 ? (
                // 空状态
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <svg
                    className="w-12 h-12 text-on-surface-variant mb-3"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1"
                  >
                    <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-on-surface-variant text-sm mb-1">该文件夹暂无收藏</p>
                  <p className="text-on-surface-variant/60 text-xs">
                    去题目详情页点击收藏按钮添加题目
                  </p>
                </div>
              ) : (
                // 题目卡片网格
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {folderQuestions.items.map((item) => (
                    <Link
                      key={item.id}
                      href={`/questions/${item.questionId}`}
                      className="group relative p-4 rounded-lg transition-colors hover:shadow-md"
                      style={{
                        backgroundColor: "var(--surface-container)",
                        border: "1px solid var(--outline-variant)",
                      }}
                    >
                      {/* 移除按钮 */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          removeBookmark(selectedFolderId!, item.questionId);
                        }}
                        className="absolute top-2 right-2 p-1 rounded max-sm:opacity-100 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-error-container"
                        title="移除收藏"
                      >
                        <svg className="w-4 h-4 text-error" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>

                      {/* 题目标题 */}
                      <h3 className="text-sm font-medium text-on-surface mb-2 pr-6 truncate">
                        {item.question.title}
                      </h3>

                      {/* 难度和标签 */}
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        <DifficultyBadge
                          difficulty={item.question.difficulty as "easy" | "medium" | "hard"}
                        />
                        {item.question.tags.slice(0, 2).map((t) => (
                          <TagBadge key={t.tag} tag={t.tag} />
                        ))}
                      </div>

                      {/* 收藏时间 */}
                      <p className="text-[11px] text-on-surface-variant">
                        收藏于 {formatRelativeTime(item.addedAt)}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
