import { useCallback, useEffect, useState } from "react"
import { useCreateNote } from "../api/internal"
import { graphql } from "../api/graphql"
import { useQuery, useApolloClient } from "@apollo/client/react"

const queryMyScopes = graphql(`
    query MyScopes {
        viewer {
            scopes {
                id
                name
            }
        }
    }
`)

export function ComposePost() {
    const [selectedScopeId, setSelectedScopeId] = useState("")
    const [text, setText] = useState("")

    const scopes = useQuery(queryMyScopes)
    const apolloClient = useApolloClient()

    const createPost = useCreateNote({
        mutation: {
            onSuccess() {
                setText("")
                apolloClient.refetchQueries({
                    include: "active",
                    onQueryUpdated(observableQuery) {
                        return observableQuery.query.definitions.some(def =>
                            def.kind === "OperationDefinition" &&
                            def.selectionSet.selections.some(sel =>
                                sel.kind === "Field" && sel.name.value === "recentNotes"
                            )
                        )
                    },
                })
            }
        }
    })

    useEffect(() => {
        if (scopes.data == null) return
        if (scopes.data.viewer.scopes.length === 0) return
        if (scopes.data.viewer.scopes.some(item => item.id === selectedScopeId)) return
        setSelectedScopeId(scopes.data.viewer.scopes[0].id)
    }, [selectedScopeId, scopes.data?.viewer.scopes.map(s => s.id).join(",") ?? ""])

    const submit = useCallback(() => {
        createPost.mutate({
            data: {
                content: {
                    text,
                },
                attributes: {},
                content_type: "text/plain",
                scope_id: selectedScopeId!,
                text_for_search: text,
                parents: undefined,
                started_at: null,
                summary: null,
                written_at: null,
            }
        })
    }, [text, selectedScopeId, createPost])

    if (scopes.data == null) {
        return <div>{":("} {JSON.stringify(scopes.error)}</div>
    }

    return <div>
        <select value={selectedScopeId} onChange={e => {
            const scopeId = e.currentTarget.value
            if (scopeId === "") {
                return
            }
            setSelectedScopeId(scopeId)
        }}>
            {scopes.data?.viewer.scopes.map(scope => <option key={scope.id} value={scope.id}>{scope.name}</option>)}
        </select>
        <textarea value={text} onInput={e => setText(e.currentTarget.value)} onKeyDown={e => {
            if ((e.metaKey || e.ctrlKey) && e.code == "Enter") {
                submit()
            }
        }}/>
        <button onClick={submit} disabled={createPost.isPending || !selectedScopeId}>Send</button>
    </div>
}