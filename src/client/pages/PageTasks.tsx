import { useQuery } from "@apollo/client/react"
import { useMemo } from "react"

import { type DocumentType, graphql } from "../api/graphql"
import { Note } from "../components/Note"
import type { TaskContents } from "../components/note-content-types/notesnet-task/types"
import { useStickToBottom } from "../utils/use-stick-to-bottom"

const queryTasks = graphql(`
    query Tasks {
        recentNotes(contentTypes: ["notesnet/task"]) {
            id
            scope {
                permissions {
                    canAddTheirNotesToChild
                    canModifyNotes
                }
            }
            latestRevision {
                id
                summary
                writtenAt
                insertedAt
                contentType
                content
                attributes
            }
        }
    }
`)

type TaskNote = DocumentType<typeof queryTasks>["recentNotes"][number]
type RenderableTaskNote = TaskNote & {
    latestRevision: NonNullable<TaskNote["latestRevision"]>
}

type TaskAttrs = TaskContents["attributes"]

function getTaskAttributes(rev: RenderableTaskNote["latestRevision"]): TaskAttrs {
    const attrs = rev.attributes
    if (attrs == null || typeof attrs !== "object" || Array.isArray(attrs)) return {}
    return attrs as TaskAttrs
}

function getValidDeadlineAt(attrs: TaskAttrs): number | null {
    const { deadlineAt } = attrs
    if (typeof deadlineAt !== "number" || !Number.isFinite(deadlineAt)) return null
    return deadlineAt
}

export function PageTasks() {
    const { data, loading, error } = useQuery(queryTasks)

    useStickToBottom(data != null)

    const ordered = useMemo<RenderableTaskNote[]>(() => {
        if (data == null) return []

        // done を除外
        const renderable = data.recentNotes.filter(
            (note): note is RenderableTaskNote =>
                note.latestRevision != null && getTaskAttributes(note.latestRevision).state !== "done"
        )

        // 並び替え（画面下が最重要）:
        // - deadline なしを上、deadline ありを下
        // - deadline なしグループ内: 追加が新しい順（古いほど下）→ insertedAt 降順
        // - deadline ありグループ内: deadline が遠い順（近いほど下）→ deadlineAt 降順
        const withoutDeadline: { note: RenderableTaskNote; insertedAt: number }[] = []
        const withDeadline: { note: RenderableTaskNote; deadlineAt: number; insertedAt: number }[] = []

        for (const note of renderable) {
            const attrs = getTaskAttributes(note.latestRevision)
            const deadlineAt = getValidDeadlineAt(attrs)
            const insertedAt = new Date(note.latestRevision.insertedAt).getTime()
            if (deadlineAt != null) {
                withDeadline.push({ note, deadlineAt, insertedAt })
            } else {
                withoutDeadline.push({ note, insertedAt })
            }
        }

        withoutDeadline.sort((a, b) => {
            if (b.insertedAt !== a.insertedAt) return b.insertedAt - a.insertedAt
            // tie-breaker: 安定した順序のため最新リビジョン id を使う
            return b.note.latestRevision.id.localeCompare(a.note.latestRevision.id)
        })

        withDeadline.sort((a, b) => {
            if (b.deadlineAt !== a.deadlineAt) return b.deadlineAt - a.deadlineAt
            if (b.insertedAt !== a.insertedAt) return b.insertedAt - a.insertedAt
            return b.note.latestRevision.id.localeCompare(a.note.latestRevision.id)
        })

        return [...withoutDeadline.map(x => x.note), ...withDeadline.map(x => x.note)]
    }, [data])

    if (loading && !data) return <div>Loading...</div>
    if (error || !data)
        return (
            <div>
                {":("} {error?.message}
            </div>
        )

    return (
        <div>
            {ordered.map(note => (
                <Note key={note.id} note={note} revision={note.latestRevision} />
            ))}
        </div>
    )
}
