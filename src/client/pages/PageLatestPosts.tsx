import { useQuery } from "@apollo/client/react"
import { useEffect, useRef } from "react"

import { graphql } from "../api/graphql"
import { Note } from "../components/Note"
import { SimpleNoteLink } from "../components/SimpleNoteLink"
import { ReplyButton } from "../contexts/ReplyContext"

const queryRecentNotes = graphql(`
    query RecentNotes {
        recentNotes {
            id
            scope {
                permissions {
                    canAddTheirNotesToChild
                }
            }
            latestRevision {
                id
                summary
                writtenAt
                contentType
                content
                attributes
            }
            parents {
                parent {
                    id
                    latestRevision {
                        summary
                        textForSearch
                    }
                }
            }
        }
    }
`)

export function PageLatestPosts() {
    const { data, loading, error } = useQuery(queryRecentNotes)
    const wasAtBottomRef = useRef(false)

    // データロード時に一番下にスクロール
    useEffect(() => {
        if (data != null) {
            window.scrollTo(0, document.documentElement.scrollHeight)
        }
    }, [data != null])

    // スクロール位置を追跡し、リサイズ時に一番下を維持
    useEffect(() => {
        let falseTimer: ReturnType<typeof setTimeout> | null = null

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
                requestAnimationFrame(() => {
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
        }
    }, [])

    if (loading && !data) return <div>Loading...</div>
    if (error || !data)
        return (
            <div>
                {":("} {error?.message}
            </div>
        )

    return (
        <div>
            {data.recentNotes.toReversed().map(item => {
                const parents = item.parents.map(p => p.parent).filter(p => p != null)
                const rev = item.latestRevision
                if (!rev) return null
                return (
                    <div key={rev.id}>
                        {parents.map((parent, i) => (
                            <div key={parent.id}>
                                {i ? "├" : "┌"}親: <ReplyButton id={parent.id} />
                                <SimpleNoteLink
                                    id={parent.id}
                                    summary={parent.latestRevision?.summary || ""}
                                    textForSearch={parent.latestRevision?.textForSearch || ""}
                                />
                            </div>
                        ))}
                        <Note note={item} revision={rev} />
                    </div>
                )
            })}
        </div>
    )
}
