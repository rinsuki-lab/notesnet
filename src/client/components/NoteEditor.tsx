import { useMutation } from "@apollo/client/react"
import { useCallback, useState, type KeyboardEvent } from "react"

import { graphql } from "../api/graphql/index.ts"
import { editableNoteContentTypes, type NoteContentEditModule, type NoteContents } from "./note-content-types/index.ts"

import "./NoteEditor.css"

const mutationUpdateNote = graphql(`
    mutation UpdateNote($noteId: ID!, $previousRevisionId: ID!, $revision: CreateNewNoteRevisionInput!) {
        updateNote(noteId: $noteId, previousRevisionId: $previousRevisionId, revision: $revision) {
            id
        }
    }
`)

const mutationDeleteNote = graphql(`
    mutation DeleteNote($noteId: ID!) {
        deleteNote(noteId: $noteId)
    }
`)

type NoteEditorProps = {
    note: { id: string }
    revision: {
        id: string
        summary?: string | null
        writtenAt: string
        contentType: string
        content: unknown
        attributes: unknown
    }
    onClose: () => void
}

export function NoteEditor(props: NoteEditorProps) {
    const module = editableNoteContentTypes[props.revision.contentType]
    if (module == null) {
        return (
            <div className="note-editor">
                <div className="error">このコンテンツタイプは編集できません: {props.revision.contentType}</div>
                <div className="actions">
                    <button type="button" onClick={props.onClose}>
                        Close
                    </button>
                </div>
            </div>
        )
    }

    return <NoteEditorInner {...props} module={module} />
}

function NoteEditorInner(props: NoteEditorProps & { module: NoteContentEditModule<NoteContents> }) {
    const initialSummary = props.revision.summary ?? ""
    const originalContents: NoteContents = {
        content: props.revision.content,
        attributes: props.revision.attributes,
    }

    const [summary, setSummary] = useState(initialSummary)
    const [contentType, setContentType] = useState<string>(props.revision.contentType)
    const [contents, setContents] = useState<NoteContents>(originalContents)

    const module = editableNoteContentTypes[contentType] ?? props.module
    const isOriginalContentType = contentType === props.revision.contentType
    const initialContents: NoteContents = isOriginalContentType ? originalContents : module.initialContents()

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

    const [deleteNote, deleteNoteResult] = useMutation(mutationDeleteNote, {
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

    const busy = updateNoteResult.loading || deleteNoteResult.loading
    const isDirty = summary !== initialSummary || !module.isEqual(initialContents, contents)
    const canSubmit = isDirty && module.canSubmit(contents) && !busy

    const submit = useCallback(() => {
        if (!canSubmit) return
        const trimmedSummary = summary.trim()
        void updateNote({
            variables: {
                noteId: props.note.id,
                previousRevisionId: props.revision.id,
                revision: {
                    content: contents.content,
                    contentType,
                    attributes: contents.attributes,
                    textForSearch: module.computeTextForSearch(contents),
                    startedAt: null,
                    writtenAt: props.revision.writtenAt,
                    summary: trimmedSummary.length ? trimmedSummary : null,
                },
            },
        })
    }, [
        canSubmit,
        summary,
        contents,
        contentType,
        module,
        updateNote,
        props.note.id,
        props.revision.id,
        props.revision.writtenAt,
    ])

    const cancel = useCallback(() => {
        if (busy) return
        if (isDirty && !window.confirm("変更を破棄しますか?")) return
        props.onClose()
    }, [isDirty, props.onClose, busy])

    const handleDelete = useCallback(() => {
        if (busy) return
        if (!window.confirm("このノートを削除しますか?この操作は取り消せません。")) return
        void deleteNote({
            variables: {
                noteId: props.note.id,
            },
        })
    }, [busy, deleteNote, props.note.id])

    const handleContentTypeChange = useCallback(
        (nextContentType: string) => {
            if (nextContentType === contentType) return
            const nextModule = editableNoteContentTypes[nextContentType]
            if (nextModule == null) return
            if (isDirty && !window.confirm("入力内容を破棄しますか?")) {
                return
            }
            setContentType(nextContentType)
            if (nextContentType === props.revision.contentType) {
                setContents(originalContents)
            } else {
                setContents(nextModule.initialContents())
            }
        },
        [contentType, isDirty, originalContents, props.revision.contentType]
    )

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
                disabled={busy}
            />
            <select
                className="contenttype-select"
                value={contentType}
                disabled={busy}
                onChange={e => handleContentTypeChange(e.currentTarget.value)}
            >
                {Object.entries(editableNoteContentTypes).map(([key, m]) => (
                    <option key={key} value={key}>
                        {m.contentType}
                    </option>
                ))}
            </select>
            <div className="content-editor">
                <module.Editor
                    content={contents.content}
                    attributes={contents.attributes}
                    update={setContents}
                    disabled={busy}
                    autoFocus
                />
            </div>
            <div className="actions">
                <button type="button" onClick={submit} disabled={!canSubmit}>
                    Save
                </button>
                <button type="button" onClick={cancel} disabled={busy}>
                    Cancel
                </button>
                <button type="button" className="delete-button" onClick={handleDelete} disabled={busy}>
                    Delete
                </button>
            </div>
            {updateNoteResult.error && <div className="error">Failed to save: {`${updateNoteResult.error}`}</div>}
            {deleteNoteResult.error && <div className="error">Failed to delete: {`${deleteNoteResult.error}`}</div>}
        </div>
    )
}
