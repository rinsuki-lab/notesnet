import { useQuery, useMutation, useApolloClient } from "@apollo/client/react"
import { useCallback, useContext, useState } from "react"

import { graphql } from "../api/graphql/index.ts"

import "./ComposePost.css"
import { ReplyContext } from "../contexts/ReplyContext.tsx"
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
    const [text, setText] = useState("")

    const scopes = useQuery(queryMyScopes)
    const apolloClient = useApolloClient()

    const [createNewNote, createNewNoteResult] = useMutation(mutationCreateNewNote, {
        onCompleted() {
            setText("")
            replyContext?.[1]([])
            apolloClient.cache.evict({ fieldName: "recentNotes" })
        },
    })

    const writableScopes = scopes.data?.viewer.scopes.filter(s => s.permissions?.canModifyNotes) ?? []
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
    }, [text, effectiveScopeId, canSubmit, createNewNote, replyContext?.[0].join(",")])

    return (
        <div className="compose-post">
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
