import { useMutation } from "@apollo/client/react"
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react"

import { graphql } from "../api/graphql/index.ts"

import "./NoteEditor.css"

const mutationUpdateNote = graphql(`
    mutation UpdateNote($noteId: ID!, $previousRevisionId: ID!, $revision: CreateNewNoteRevisionInput!) {
        updateNote(noteId: $noteId, previousRevisionId: $previousRevisionId, revision: $revision) {
            id
        }
    }
`)

export function NoteEditor(props: {
    note: { id: string }
    revision: {
        id: string
        summary?: string | null
        writtenAt: string
        content: unknown
    }
    onClose: () => void
}) {
    const initialText = (() => {
        const content = props.revision.content
        if (content && typeof content === "object" && "text" in content && typeof content.text === "string") {
            return content.text
        }
        return ""
    })()
    const initialSummary = props.revision.summary ?? ""

    const [summary, setSummary] = useState(initialSummary)
    const [text, setText] = useState(initialText)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    useEffect(() => {
        const el = textareaRef.current
        if (el == null) return
        el.focus()
        const len = el.value.length
        el.setSelectionRange(len, len)
    }, [])

    const [updateNote, updateNoteResult] = useMutation(mutationUpdateNote, {
        update(cache) {
            const cacheId = cache.identify({ __typename: "Note", id: props.note.id })
            if (cacheId != null) {
                cache.evict({ id: cacheId })
                cache.gc()
            }
        },
        onCompleted() {
            props.onClose()
        },
    })

    const isDirty = summary !== initialSummary || text !== initialText
    const canSubmit = isDirty && text.trim().length > 0 && !updateNoteResult.loading

    const submit = useCallback(() => {
        if (!canSubmit) return
        const trimmedSummary = summary.trim()
        void updateNote({
            variables: {
                noteId: props.note.id,
                previousRevisionId: props.revision.id,
                revision: {
                    content: { text },
                    contentType: "text/plain",
                    attributes: {},
                    textForSearch: text,
                    startedAt: null,
                    writtenAt: props.revision.writtenAt,
                    summary: trimmedSummary.length ? trimmedSummary : null,
                },
            },
        })
    }, [canSubmit, summary, text, updateNote, props.note.id, props.revision.id, props.revision.writtenAt])

    const cancel = useCallback(() => {
        if (updateNoteResult.loading) return
        if (isDirty && !window.confirm("変更を破棄しますか?")) return
        props.onClose()
    }, [isDirty, props.onClose, updateNoteResult.loading])

    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (e.nativeEvent.isComposing) return
            if ((e.metaKey || e.ctrlKey) && e.code === "Enter") {
                e.preventDefault()
                submit()
            } else if (e.code === "Escape") {
                e.preventDefault()
                cancel()
            }
        },
        [submit, cancel]
    )

    return (
        <div className="note-editor" onKeyDown={handleKeyDown}>
            <input
                className="summary-input"
                type="text"
                value={summary}
                onChange={e => setSummary(e.currentTarget.value)}
                placeholder="Summary (optional)"
                disabled={updateNoteResult.loading}
            />
            <textarea
                ref={textareaRef}
                className="text-input"
                value={text}
                onChange={e => setText(e.currentTarget.value)}
                disabled={updateNoteResult.loading}
            />
            <div className="actions">
                <button type="button" onClick={submit} disabled={!canSubmit}>
                    Save
                </button>
                <button type="button" onClick={cancel} disabled={updateNoteResult.loading}>
                    Cancel
                </button>
            </div>
            {updateNoteResult.error && <div className="error">Failed to save: {`${updateNoteResult.error}`}</div>}
        </div>
    )
}
