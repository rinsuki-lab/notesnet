import { useQuery, useMutation, useApolloClient } from "@apollo/client/react"
import { useCallback, useState } from "react"

import { graphql } from "../api/graphql/index.ts"

import "./ComposePost.css"

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
    const [selectedScopeId, setSelectedScopeId] = useState("")
    const [text, setText] = useState("")

    const scopes = useQuery(queryMyScopes)
    const apolloClient = useApolloClient()

    const [createNewNote, createNewNoteResult] = useMutation(mutationCreateNewNote, {
        onCompleted() {
            setText("")
            apolloClient.cache.evict({ fieldName: "recentNotes" })
        },
    })

    const writableScopes = scopes.data?.viewer.scopes.filter(s => s.permissions.canModifyNotes) ?? []
    const effectiveScopeId = writableScopes.some(s => s.id === selectedScopeId)
        ? selectedScopeId
        : (writableScopes[0]?.id ?? "")

    const canSubmit = effectiveScopeId.length && text.trim().length && !createNewNoteResult.loading

    const submit = useCallback(() => {
        if (!canSubmit) return
        void createNewNote({
            variables: {
                input: {
                    content: { text },
                    scopeId: effectiveScopeId,
                    contentType: "text/plain",
                    attributes: {},
                    textForSearch: text,
                    startedAt: null,
                    writtenAt: null,
                    summary: null,
                },
            },
        })
    }, [text, effectiveScopeId, canSubmit, createNewNote])

    return (
        <div className="compose-post">
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
                        .filter(s => s.permissions.canModifyNotes)
                        .map(scope => (
                            <option key={scope.id} value={scope.id}>
                                {scope.name}
                            </option>
                        ))}
                </select>
            ) : (
                <div>Loading scopes...</div>
            )}
            <textarea
                className="text-input"
                value={text}
                onChange={e => setText(e.currentTarget.value)}
                disabled={createNewNoteResult.loading}
                onKeyDown={e => {
                    if ((e.metaKey || e.ctrlKey) && e.code === "Enter") {
                        e.preventDefault()
                        submit()
                    }
                }}
            />
            <button className="send-button" type="button" onClick={submit} disabled={!canSubmit}>
                Send
            </button>
            {createNewNoteResult.error && <div>Failed to post: {`${createNewNoteResult.error}`}</div>}
        </div>
    )
}
