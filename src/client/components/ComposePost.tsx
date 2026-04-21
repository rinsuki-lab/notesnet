import { useCallback, useEffect, useState } from "react"
import { getListNotesQueryKey, useCreateNote, useGetMeScopes } from "../api/internal"
import { queryClient } from "../api/query-client"

export function ComposePost() {
    const [selectedScopeId, setSelectedScopeId] = useState("")
    const [text, setText] = useState("")

    const scopes = useGetMeScopes()
    const createPost = useCreateNote({
        mutation: {
            onSuccess() {
                setText("")
                queryClient.invalidateQueries({
                    queryKey: getListNotesQueryKey(),
                })
            }
        }
    })

    useEffect(() => {
        if (scopes.data?.status !== 200) return
        if (scopes.data.data.items.length === 0) return
        if (scopes.data.data.items.some(item => item.id === selectedScopeId)) return
        setSelectedScopeId(scopes.data.data.items[0].id)
    }, [selectedScopeId, scopes.data?.status, scopes.data?.data])

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

    if (scopes.data?.status !== 200) {
        return <div>{":("} {JSON.stringify(scopes.data)}</div>
    }

    return <div>
        <select value={selectedScopeId} onChange={e => {
            const scopeId = e.currentTarget.value
            if (scopeId === "") {
                return
            }
            setSelectedScopeId(scopeId)
        }}>
            {scopes.data?.data.items.map(scope => <option key={scope.id} value={scope.id}>{scope.name}</option>)}
        </select>
        <textarea value={text} onInput={e => setText(e.currentTarget.value)} onKeyDown={e => {
            if ((e.metaKey || e.ctrlKey) && e.code == "Enter") {
                submit()
            }
        }}/>
        <button onClick={submit} disabled={createPost.isPending || !selectedScopeId}>Send</button>
    </div>
}