import { useQuery, useMutation } from "@apollo/client/react"
import { useCallback, useContext, useState, type KeyboardEvent } from "react"

import { graphql } from "../api/graphql/index.ts"

import "./ComposePost.css"
import { ReplyContext } from "../contexts/ReplyContext.tsx"
import { defaultComposeContentType, editableNoteContentTypes, type NoteContents } from "./note-content-types/index.ts"
import { SimpleNoteLinkFromId } from "./SimpleNoteLink.tsx"

const queryMyScopes = graphql(`
    query MyScopes {
        viewer {
            scopes {
                id
                name
                permissions {
                    canModifyNotes
                }
            }
        }
    }
`)

const mutationCreateNewNote = graphql(`
    mutation CreateNewNote($input: CreateNewNoteInput!) {
        createNewNote(input: $input) {
            id
        }
    }
`)

export function ComposePost() {
    const replyContext = useContext(ReplyContext)
    const [selectedScopeId, setSelectedScopeId] = useState("")
    const [summary, setSummary] = useState("")

    const [contentType, setContentType] = useState<string>(defaultComposeContentType)
    const module = editableNoteContentTypes[contentType]
    if (module == null) {
        throw new Error(`Unknown editable note content type: ${contentType}`)
    }
    const [contents, setContents] = useState<NoteContents>(() => module.initialContents())

    const scopes = useQuery(queryMyScopes)
    const [createNewNote, createNewNoteResult] = useMutation(mutationCreateNewNote, {
        update(cache, _result, { variables }) {
            const parentNoteIds = variables?.input.parents?.map(parent => parent.noteId) ?? []

            for (const parentNoteId of parentNoteIds) {
                const cacheId = cache.identify({ __typename: "Note", id: parentNoteId })
                if (cacheId == null) continue

                cache.evict({
                    id: cacheId,
                    fieldName: "childs",
                })
            }
            cache.evict({ fieldName: "recentNotes" })
        },
        onCompleted() {
            setSummary("")
            setContents(module.initialContents())
            replyContext?.[1]([])
        },
    })

    const writableScopes = scopes.data?.viewer.scopes.filter(s => s.permissions?.canModifyNotes) ?? []
    const effectiveScopeId = writableScopes.some(s => s.id === selectedScopeId)
        ? selectedScopeId
        : (writableScopes[0]?.id ?? "")

    const canSubmit = effectiveScopeId.length > 0 && module.canSubmit(contents) && !createNewNoteResult.loading

    const submit = useCallback(() => {
        if (!canSubmit) return
        const trimmedSummary = summary.trim()
        void createNewNote({
            variables: {
                input: {
                    scopeId: effectiveScopeId,
                    revision: {
                        content: contents.content,
                        contentType: module.contentType,
                        attributes: contents.attributes,
                        textForSearch: module.computeTextForSearch(contents),
                        startedAt: null,
                        writtenAt: null,
                        summary: trimmedSummary.length ? trimmedSummary : null,
                    },
                    parents: replyContext
                        ? replyContext[0].map(noteId => {
                              return {
                                  noteId,
                              }
                          })
                        : [],
                },
            },
        })
    }, [contents, summary, effectiveScopeId, canSubmit, createNewNote, module, replyContext?.[0].join(",")])

    const handleSubmitKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.code === "Enter") {
                e.preventDefault()
                submit()
            }
        },
        [submit]
    )

    const handleContentTypeChange = useCallback(
        (nextContentType: string) => {
            if (nextContentType === contentType) return
            const nextModule = editableNoteContentTypes[nextContentType]
            if (nextModule == null) return
            const isDirty = !module.isEqual(module.initialContents(), contents)
            if (isDirty && !window.confirm("入力内容を破棄しますか?")) {
                return
            }
            setContentType(nextContentType)
            setContents(nextModule.initialContents())
        },
        [contentType, contents, module]
    )

    return (
        <div className="compose-post" onKeyDown={handleSubmitKeyDown}>
            <div className="parents-list">
                {replyContext?.[0].length ? (
                    <>
                        {replyContext[0].map(id => (
                            <div key={id}>
                                <button
                                    onClick={() => {
                                        replyContext[1](ids => ids.filter(i => i !== id))
                                    }}
                                >
                                    ×
                                </button>
                                <SimpleNoteLinkFromId id={id} />
                            </div>
                        ))}
                    </>
                ) : (
                    "現在何も選択していません"
                )}
            </div>
            <input
                className="summary-input"
                type="text"
                value={summary}
                onChange={e => setSummary(e.currentTarget.value)}
                placeholder="Summary (optional)"
                disabled={createNewNoteResult.loading}
            />
            {scopes.data != null ? (
                <select
                    className="scope-select"
                    value={effectiveScopeId}
                    disabled={createNewNoteResult.loading}
                    onChange={e => {
                        const scopeId = e.currentTarget.value
                        if (scopeId === "") {
                            return
                        }
                        setSelectedScopeId(scopeId)
                    }}
                >
                    {scopes.data.viewer.scopes
                        .filter(s => s.permissions?.canModifyNotes)
                        .map(scope => (
                            <option key={scope.id} value={scope.id}>
                                {scope.name}
                            </option>
                        ))}
                </select>
            ) : (
                <div>Loading scopes...</div>
            )}
            <select
                className="contenttype-select"
                value={contentType}
                disabled={createNewNoteResult.loading}
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
                    disabled={createNewNoteResult.loading}
                />
            </div>
            <button className="send-button" type="button" onClick={submit} disabled={!canSubmit}>
                Send
            </button>
            {createNewNoteResult.error && <div>Failed to post: {`${createNewNoteResult.error}`}</div>}
        </div>
    )
}
