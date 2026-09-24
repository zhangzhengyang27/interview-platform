// Button 组件的单元测试
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Button } from "./Button";

describe("Button 组件", () => {
  it("应当正确渲染子内容", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button")).toHaveTextContent("Click me");
  });

  it("应当点击后触发 onClick 回调", () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    fireEvent.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("默认 variant 为 primary，size 为 md", () => {
    render(<Button>Default</Button>);
    const button = screen.getByRole("button");
    // 检查是否存在 primary variant 相关 class
    expect(button.className).toContain("bg-primary-container");
    // 检查是否存在 md size 相关 class
    expect(button.className).toContain("px-4");
  });

  it("应当应用 secondary variant 样式", () => {
    render(<Button variant="secondary">Secondary</Button>);
    const button = screen.getByRole("button");
    expect(button.className).toContain("bg-transparent");
    expect(button.className).toContain("border-outline-variant");
  });

  it("应当应用 ghost variant 样式", () => {
    render(<Button variant="ghost">Ghost</Button>);
    const button = screen.getByRole("button");
    expect(button.className).toContain("text-on-surface-variant");
  });

  it("应当应用 danger variant 样式", () => {
    render(<Button variant="danger">Danger</Button>);
    const button = screen.getByRole("button");
    expect(button.className).toContain("text-error");
  });

  it("应当应用 sm size 样式", () => {
    render(<Button size="sm">Small</Button>);
    expect(screen.getByRole("button").className).toContain("px-3");
  });

  it("应当应用 lg size 样式", () => {
    render(<Button size="lg">Large</Button>);
    expect(screen.getByRole("button").className).toContain("px-6");
  });

  it("disabled 状态下不应触发点击事件", () => {
    const handleClick = vi.fn();
    render(
      <Button disabled onClick={handleClick}>
        Disabled
      </Button>
    );
    fireEvent.click(screen.getByRole("button"));
    // 当按钮为 disabled 时，点击不会触发回调
    expect(handleClick).not.toHaveBeenCalled();
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("应当合并自定义 className", () => {
    render(<Button className="custom-class">Custom</Button>);
    expect(screen.getByRole("button").className).toContain("custom-class");
  });

  it("应当支持自定义 type 属性", () => {
    render(<Button type="submit">Submit</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("type", "submit");
  });

  it("应当设置正确的 displayName", () => {
    expect(Button.displayName).toBe("Button");
  });
});
