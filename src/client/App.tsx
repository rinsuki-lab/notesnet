import { Route, Routes } from "react-router"
import { ComposePost } from "./components/ComposePost"
import { PageLatestPosts } from "./pages/PageLatestPosts"
import { PageLogin } from "./pages/PageLogin"
import { PageNoteDetail } from "./pages/PageNoteDetail"
import { graphql } from "./api/graphql"
import { useQuery } from "@apollo/client/react"
import { ServerError } from "@apollo/client"

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
        return <div>
            <PageLogin />
        </div>
    }

    if (user.error) {
        return <div>
            Error: {user.error.message}
        </div>
    }

    if (user.data == null) {
        return "Loading..."
    }

    return <div>
        <Routes>
            <Route path="/" element={<PageLatestPosts />} />
            <Route path="/notes/:noteId" element={<PageNoteDetail />} />
        </Routes>
        <ComposePost />
    </div>
}