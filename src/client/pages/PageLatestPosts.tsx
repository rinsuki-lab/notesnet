import { useQuery } from "@apollo/client/react"
import { useEffect, useRef } from "react"

import { type DocumentType, graphql } from "../api/graphql"
import { Note } from "../components/Note"
import { SimpleNoteLink } from "../components/SimpleNoteLink"
import { TreeUl } from "../components/TreeUl"
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

type RecentNote = DocumentType<typeof queryRecentNotes>["recentNotes"][number]
type RenderableRecentNote = RecentNote & {
    latestRevision: NonNullable<RecentNote["latestRevision"]>
}
type ChildTreeNode = {
    note: RenderableRecentNote
    children: ChildTreeNode[]
}

function collectChildTrees(notes: RecentNote[], parentId: string, startIndex: number) {
    const nodes: ChildTreeNode[] = []
    let index = startIndex

    while (index < notes.length) {
        const note = notes[index]
        if (note == null) break
        if (note.latestRevision == null) break
        if (note.parents.length !== 1) break
        if (note.parents[0]?.parent?.id !== parentId) break

        const renderableNote = note as RenderableRecentNote
        const { nodes: children, nextIndex } = collectChildTrees(notes, note.id, index + 1)
        nodes.push({ note: renderableNote, children })
        index = nextIndex
    }

    return { nodes, nextIndex: index }
}

function renderChildTrees(nodes: ChildTreeNode[]) {
    if (!nodes.length) return null

    return (
        <TreeUl start="top" firstMargin={8} secondMargin={8} innerPadding={0}>
            {nodes.map(({ note, children }) => (
                <li key={note.id}>
                    <Note note={note} revision={note.latestRevision} />
                    {renderChildTrees(children)}
                </li>
            ))}
        </TreeUl>
    )
}

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

    const reversedNotes = data.recentNotes.toReversed()
    const noteBlocks = []

    for (let index = 0; index < reversedNotes.length; index++) {
        const note = reversedNotes[index]
        if (note == null) continue
        const parents = note.parents.map(p => p.parent).filter(p => p != null)
        const rev = note.latestRevision
        if (!rev) continue

        const { nodes: childTrees, nextIndex } = collectChildTrees(reversedNotes, note.id, index + 1)
        noteBlocks.push(
            <div key={rev.id}>
                <TreeUl start="bottom" firstMargin={8} secondMargin={8} innerPadding={0}>
                    {parents.map(parent => (
                        <li key={parent.id}>
                            <ReplyButton id={parent.id} />
                            <SimpleNoteLink
                                id={parent.id}
                                summary={parent.latestRevision?.summary || ""}
                                textForSearch={parent.latestRevision?.textForSearch || ""}
                            />
                        </li>
                    ))}
                </TreeUl>
                <Note note={note} revision={rev} />
                {renderChildTrees(childTrees)}
            </div>
        )
        index = nextIndex - 1
    }

    return <div>{noteBlocks}</div>
}
