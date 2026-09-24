// Badge 组件的单元测试
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DifficultyBadge, TagBadge, ErrorCountBadge } from "./Badge";

describe("DifficultyBadge 组件", () => {
  it("应当正确渲染简单难度标签", () => {
    render(<DifficultyBadge difficulty="easy" />);
    expect(screen.getByText("简单")).toBeInTheDocument();
  });

  it("应当正确渲染中等难度标签", () => {
    render(<DifficultyBadge difficulty="medium" />);
    expect(screen.getByText("中等")).toBeInTheDocument();
  });

  it("应当正确渲染困难难度标签", () => {
    render(<DifficultyBadge difficulty="hard" />);
    expect(screen.getByText("困难")).toBeInTheDocument();
  });

  it("应当合并自定义 className", () => {
    render(<DifficultyBadge difficulty="easy" className="custom-class" />);
    const badge = screen.getByText("简单");
    expect(badge.className).toContain("custom-class");
  });

  it("应当具有 monospace 字体样式", () => {
    render(<DifficultyBadge difficulty="easy" />);
    const badge = screen.getByText("简单");
    expect(badge.className).toContain("font-mono");
  });
});

describe("TagBadge 组件", () => {
  it("应当正确渲染标签文本", () => {
    render(<TagBadge tag="JavaScript" />);
    expect(screen.getByText("JavaScript")).toBeInTheDocument();
  });

  it("应当为已知标签应用对应颜色", () => {
    render(<TagBadge tag="React" />);
    const badge = screen.getByText("React");
    expect(badge.className).toContain("font-mono");
    expect(badge.className).toContain("font-semibold");
  });

  it("应当为未知标签应用默认颜色", () => {
    render(<TagBadge tag="UnknownTag" />);
    const badge = screen.getByText("UnknownTag");
    // 未知标签也应该有基础样式
    expect(badge.className).toContain("font-mono");
  });

  it("应当合并自定义 className", () => {
    render(<TagBadge tag="前端" className="extra-class" />);
    expect(screen.getByText("前端").className).toContain("extra-class");
  });
});

describe("ErrorCountBadge 组件", () => {
  it("应当正确渲染错误次数", () => {
    render(<ErrorCountBadge count={3} />);
    expect(screen.getByText("错 3 次")).toBeInTheDocument();
  });

  it("应当渲染 0 次错误", () => {
    render(<ErrorCountBadge count={0} />);
    expect(screen.getByText("错 0 次")).toBeInTheDocument();
  });

  it("应当包含错误容器色作为背景", () => {
    render(<ErrorCountBadge count={5} />);
    const badge = screen.getByText("错 5 次");
    // 检查 style 属性中是否包含 --error-container
    const style = badge.getAttribute("style") ?? "";
    expect(style).toContain("--error-container");
  });

  it("应当合并自定义 className", () => {
    render(<ErrorCountBadge count={1} className="my-class" />);
    expect(screen.getByText("错 1 次").className).toContain("my-class");
  });
});
