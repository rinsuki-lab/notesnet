import { ServerError } from "@apollo/client"
import { useQuery } from "@apollo/client/react"
import { Route, Routes } from "react-router"

import { graphql } from "./api/graphql"
import { ComposePost } from "./components/ComposePost.tsx"
import { ReplyContextProvider } from "./contexts/ReplyContext.tsx"
import { PageLatestPosts } from "./pages/PageLatestPosts"
import { PageLogin } from "./pages/PageLogin"
import { PageNoteDetail } from "./pages/PageNoteDetail.tsx"

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
                <div id="app-content">
                    <Routes>
                        <Route path="/" element={<PageLatestPosts />} />
                        <Route path="/notes/:noteId" element={<PageNoteDetail />} />
                        <Route path="/debug/tree-ul" element={<PageTreeUlDebug />} />
                    </Routes>
                </div>
                <ComposePost />
            </ReplyContextProvider>
        </div>
    )
}
