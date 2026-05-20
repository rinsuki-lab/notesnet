import { useEffect, useRef } from "react"

/**
 * ページロード時（または `dataReady` が初めて true になった時）に最下端へスクロールし、
 * 以降ユーザーが最下端に居る間はリサイズで最下端を維持する。
 */
export function useStickToBottom(dataReady: boolean) {
    const wasAtBottomRef = useRef(false)

    useEffect(() => {
        if (dataReady) {
            window.scrollTo(0, document.documentElement.scrollHeight)
        }
    }, [dataReady])

    useEffect(() => {
        let falseTimer: ReturnType<typeof setTimeout> | null = null
        let rafId: number | null = null

        const checkAtBottom = () => {
            const distanceFromBottom = document.documentElement.scrollHeight - window.scrollY - window.innerHeight
            if (distanceFromBottom <= 10) {
                if (falseTimer) {
                    clearTimeout(falseTimer)
                    falseTimer = null
                }
                wasAtBottomRef.current = true
            } else {
                // リサイズ中の一時的なスクロールズレで誤判定しないよう遅延
                if (falseTimer) clearTimeout(falseTimer)
                falseTimer = setTimeout(() => {
                    wasAtBottomRef.current = false
                }, 150)
            }
        }

        const handleResize = () => {
            if (wasAtBottomRef.current) {
                if (rafId != null) cancelAnimationFrame(rafId)
                rafId = requestAnimationFrame(() => {
                    rafId = null
                    window.scrollTo(0, document.documentElement.scrollHeight)
                })
            }
        }

        window.addEventListener("scroll", checkAtBottom, { passive: true })
        window.addEventListener("resize", handleResize)
        checkAtBottom()

        return () => {
            window.removeEventListener("scroll", checkAtBottom)
            window.removeEventListener("resize", handleResize)
            if (falseTimer) clearTimeout(falseTimer)
            if (rafId != null) cancelAnimationFrame(rafId)
        }
    }, [])
}
