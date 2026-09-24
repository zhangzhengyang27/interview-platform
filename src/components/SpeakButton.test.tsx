import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { SpeakButton } from "./SpeakButton"

describe("SpeakButton", () => {
  beforeEach(() => {
    window.SpeechSynthesisUtterance = vi.fn() as unknown as typeof SpeechSynthesisUtterance
    window.speechSynthesis = {
      speak: vi.fn(),
      cancel: vi.fn(),
      getVoices: vi.fn(() => []),
      pause: vi.fn(),
      resume: vi.fn(),
      onvoiceschanged: null,
      pending: false,
      speaking: false,
      paused: false
    } as unknown as SpeechSynthesis
  })

  it("点击后调用 speechSynthesis.speak", () => {
    render(<SpeakButton text="hello" />)
    const button = screen.getByRole("button", { name: /朗读/ })
    fireEvent.click(button)
    expect(window.speechSynthesis.speak).toHaveBeenCalled()
  })
})
