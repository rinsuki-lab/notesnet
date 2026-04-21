import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router"
import { getListNotesQueryKey, useCreateNote, useCreateSession, useGetMe, useGetMeScopes, useListNotes } from "./api/internal"
import { QueryClientProvider } from "@tanstack/react-query"
import { queryClient } from "./api/query-client"
import { JSX, useCallback, useEffect, useState } from "react"
import { ListNotesItem } from "./api/internal/schemas"

function PageLogin() {
    const login = useCreateSession({
        mutation: {
            onSuccess(data) {
                if (data.status === 200) {
                    localStorage.setItem("notesnet_token", data.data.access_token)
                    queryClient.invalidateQueries()
                }
            }
        }
    })

    return <div>
        <form method="POST" onSubmit={e => {
            e.preventDefault()
            login.mutate({
                data: {
                    password: e.currentTarget.password.value,
                    username: e.currentTarget.username.value
                }
            })
        }}>
            <input type="text" name="username" placeholder="Username" />
            <input type="password" name="password" placeholder="Password" />
            <button type="submit">Login</button>
        </form>
    </div>
}

const renderers = {
    "text/plain": (note: ListNotesItem) => <p>{note.content.text}</p>
} satisfies Record<string, (note: ListNotesItem) => JSX.Element>

function PageLatestPosts() {
    const posts = useListNotes()

    if (posts.data?.status !== 200) {
        return <div>{":("} {JSON.stringify(posts.data)}</div>
    }

    return <div>
        {posts.data.data.items.map(item => {
            return <div key={item.revision_id}>
                <p>{item.note_id}・{item.content_type}</p>
                <p>{item.summary}</p>
                {
                    item.content_type in renderers
                        ? renderers[item.content_type](item)
                        : <p>Unsupported content type: {item.content_type}</p>
                }
            </div>
        })}
    </div>
}

function ComposePost() {
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

function Top() {
    const user = useGetMe()

    if (user.data == null) {
        return null
    }

    if (user.data.status !== 200) {
        return <div>
            <PageLogin />
        </div>
    }

    return <div>
        <PageLatestPosts />
        <ComposePost />
    </div>
}

createRoot(document.getElementById("root")!).render(
    <BrowserRouter>
        <QueryClientProvider client={queryClient}>
            <Top />
        </QueryClientProvider>
    </BrowserRouter>
)