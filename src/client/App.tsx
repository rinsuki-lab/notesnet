import { useGetMe } from "./api/internal"
import { ComposePost } from "./components/ComposePost"
import { PageLatestPosts } from "./pages/PageLatestPosts"
import { PageLogin } from "./pages/PageLogin"

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
        <PageLatestPosts />
        <ComposePost />
    </div>
}