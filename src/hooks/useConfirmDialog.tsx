"use client";

import { useCallback, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  /** 危险操作（删除/降权）使用红色确认按钮 */
  danger?: boolean;
}

interface AlertOptions {
  title?: string;
  message: string;
}

type DialogState =
  | {
      type: "confirm";
      title?: string;
      message: string;
      confirmText?: string;
      danger?: boolean;
      resolve: (value: boolean) => void;
    }
  | {
      type: "alert";
      title?: string;
      message: string;
      resolve: () => void;
    };

/**
 * 基于 Modal 组件的确认/提示对话框 hook。
 * 返回 { confirm, alert, dialog }，需在页面组件中渲染 `{dialog}`。
 *
 * 用法：
 *   const { confirm, dialog } = useConfirmDialog();
 *   if (await confirm({ message: "确定删除吗？", danger: true })) { ... }
 */
export function useConfirmDialog() {
  const [state, setState] = useState<DialogState | null>(null);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setState({ type: "confirm", ...options, resolve });
    });
  }, []);

  const alert = useCallback((options: AlertOptions) => {
    return new Promise<void>((resolve) => {
      setState({ type: "alert", ...options, resolve });
    });
  }, []);

  const handleOk = useCallback(() => {
    if (!state) return;
    if (state.type === "confirm") state.resolve(true);
    else state.resolve();
    setState(null);
  }, [state]);

  const handleCancel = useCallback(() => {
    if (!state) return;
    if (state.type === "confirm") state.resolve(false);
    setState(null);
  }, [state]);

  const dialog = state ? (
    <Modal
      open
      onClose={handleCancel}
      title={state.title ?? (state.type === "confirm" ? "确认操作" : "提示")}
      hideClose={state.type === "alert"}
      width={420}
      footer={
        state.type === "confirm" ? (
          <>
            <Button variant="secondary" onClick={handleCancel}>
              取消
            </Button>
            <Button variant={state.danger ? "danger" : "primary"} onClick={handleOk}>
              {state.confirmText ?? "确定"}
            </Button>
          </>
        ) : (
          <Button onClick={handleOk}>确定</Button>
        )
      }
    >
      <p
        className="text-sm leading-relaxed whitespace-pre-wrap"
        style={{ color: "var(--on-surface-variant)" }}
      >
        {state.message}
      </p>
    </Modal>
  ) : null;

  return { confirm, alert, dialog };
}

export type { ConfirmOptions, AlertOptions };
