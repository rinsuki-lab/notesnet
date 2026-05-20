import { ServerError } from "@apollo/client"
import { useQuery } from "@apollo/client/react"
import { useContext, useRef, useState } from "react"
import { Route, Routes } from "react-router"

import { graphql } from "./api/graphql"
import { BottomTabBar } from "./components/BottomTabBar.tsx"
import { ComposePost, type ComposePostHandle } from "./components/ComposePost.tsx"
import { ReplyContext, ReplyContextProvider } from "./contexts/ReplyContext.tsx"
import { PageLatestPosts } from "./pages/PageLatestPosts"
import { PageLogin } from "./pages/PageLogin"
import { PageNoteDetail } from "./pages/PageNoteDetail.tsx"
import { PageTasks } from "./pages/PageTasks.tsx"

import "./App.css"
import { PageTreeUlDebug } from "./pages/PageTreeUlDebug.tsx"

const queryMy = graphql(`
    query My {
        viewer {
            id
            name
        }
    }
`)

export function App() {
    const user = useQuery(queryMy)

    if (user.error instanceof ServerError && user.error.statusCode === 401) {
        return (
            <div>
                <PageLogin />
            </div>
        )
    }

    if (user.error) {
        return <div>Error: {user.error.message}</div>
    }

    if (user.data == null) {
        return "Loading..."
    }

    return (
        <div id="app-container">
            <ReplyContextProvider>
                <AppShell />
            </ReplyContextProvider>
        </div>
    )
}

function AppShell() {
    const replyContext = useContext(ReplyContext)
    const [isComposeOpen, setIsComposeOpen] = useState(false)
    const composeRef = useRef<ComposePostHandle>(null)
    const hasReplyTargets = (replyContext?.[0].length ?? 0) > 0
    const effectiveOpen = isComposeOpen || hasReplyTargets

    const handleToggleCompose = () => {
        if (!effectiveOpen) {
            setIsComposeOpen(true)
            return
        }
        const isDirty = composeRef.current?.isDirty() ?? false
        if ((isDirty || hasReplyTargets) && !window.confirm("現在の内容を破棄しますか?")) {
            return
        }
        setIsComposeOpen(false)
        replyContext?.[1]([])
    }

    return (
        <>
            <div id="app-content">
                <Routes>
                    <Route path="/" element={<PageLatestPosts />} />
                    <Route path="/notes/:noteId" element={<PageNoteDetail />} />
                    <Route path="/tasks" element={<PageTasks />} />
                    <Route path="/debug/tree-ul" element={<PageTreeUlDebug />} />
                </Routes>
            </div>
            <div className="bottom-stack">
                {effectiveOpen && <ComposePost ref={composeRef} onAfterSubmit={() => setIsComposeOpen(false)} />}
                <BottomTabBar composeOpen={effectiveOpen} onToggleCompose={handleToggleCompose} />
            </div>
        </>
    )
}
