import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { SpeakButton } from "./SpeakButton"

describe("SpeakButton", () => {
  beforeEach(() => {
    // 组件优先走豆包 TTS（fetch），失败才降级到原生 speechSynthesis
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }))
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

  it("点击后调用 speechSynthesis.speak", async () => {
    render(<SpeakButton text="hello" />)
    const button = screen.getByRole("button", { name: /朗读/ })
    fireEvent.click(button)
    await waitFor(() => {
      expect(window.speechSynthesis.speak).toHaveBeenCalled()
    })
  })
})
