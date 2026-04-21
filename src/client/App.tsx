import { Route, Routes } from "react-router"
import { useGetMe } from "./api/internal"
import { ComposePost } from "./components/ComposePost"
import { PageLatestPosts } from "./pages/PageLatestPosts"
import { PageLogin } from "./pages/PageLogin"
import { PageNoteDetail } from "./pages/PageNoteDetail"

export function App() {
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
        <Routes>
            <Route path="/" element={<PageLatestPosts />} />
            <Route path="/notes/:noteId" element={<PageNoteDetail />} />
        </Routes>
        <ComposePost />
    </div>
}