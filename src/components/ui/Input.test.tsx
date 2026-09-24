// Input / Textarea / FormError 组件的单元测试
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Input, Textarea, FormError } from "./Input";

describe("Input 组件", () => {
  it("应当正确渲染输入框", () => {
    render(<Input placeholder="输入..." />);
    expect(screen.getByPlaceholderText("输入...")).toBeInTheDocument();
  });

  it("应当支持受控值", () => {
    render(<Input value="hello" onChange={() => {}} />);
    expect((screen.getByRole("textbox") as HTMLInputElement).value).toBe("hello");
  });

  it("应当在输入时触发 onChange", () => {
    const handleChange = vi.fn();
    render(<Input onChange={handleChange} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "test" } });
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it("应当支持 ref 转发", () => {
    const ref = vi.fn();
    render(<Input ref={ref} />);
    expect(ref).toHaveBeenCalledWith(expect.any(HTMLElement));
  });

  it("error 状态下应当有 border-error 类", () => {
    render(<Input error />);
    const input = screen.getByRole("textbox");
    expect(input.className).toContain("border-error");
  });

  it("非 error 状态下不应有 border-error 类", () => {
    render(<Input />);
    const input = screen.getByRole("textbox");
    expect(input.className).not.toContain("border-error");
  });

  it("应当合并自定义 className", () => {
    render(<Input className="my-custom-class" />);
    expect(screen.getByRole("textbox").className).toContain("my-custom-class");
  });

  it("应当支持 disabled 属性", () => {
    render(<Input disabled />);
    expect(screen.getByRole("textbox")).toBeDisabled();
  });

  it("应当设置正确的 displayName", () => {
    expect(Input.displayName).toBe("Input");
  });
});

describe("Textarea 组件", () => {
  it("应当正确渲染文本域", () => {
    render(<Textarea placeholder="输入..." />);
    expect(screen.getByPlaceholderText("输入...")).toBeInTheDocument();
  });

  it("error 状态下应当有 border-error 类", () => {
    render(<Textarea error />);
    const textarea = screen.getByRole("textbox");
    expect(textarea.className).toContain("border-error");
  });

  it("应当支持 ref 转发", () => {
    const ref = vi.fn();
    render(<Textarea ref={ref} />);
    expect(ref).toHaveBeenCalledWith(expect.any(HTMLElement));
  });

  it("应当设置正确的 displayName", () => {
    expect(Textarea.displayName).toBe("Textarea");
  });
});

describe("FormError 组件", () => {
  it("应当渲染错误提示文本", () => {
    render(<FormError>密码不能为空</FormError>);
    expect(screen.getByText("密码不能为空")).toBeInTheDocument();
  });

  it("应当具有 role='alert' 属性", () => {
    render(<FormError>错误</FormError>);
    expect(screen.getByText("错误")).toHaveAttribute("role", "alert");
  });

  it("应当包含 text-error 类", () => {
    render(<FormError>错误</FormError>);
    const element = screen.getByText("错误");
    expect(element.className).toContain("text-error");
  });

  it("应当合并自定义 className", () => {
    render(<FormError className="extra-class">错误</FormError>);
    expect(screen.getByText("错误").className).toContain("extra-class");
  });
});
