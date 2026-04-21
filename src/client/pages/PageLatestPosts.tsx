import { Link } from "react-router"
import { useListNotes } from "../api/internal"
import { NoteContentRenderer } from "../components/NoteContentRenderer"

export function PageLatestPosts() {
    const posts = useListNotes()

    if (posts.data?.status !== 200) {
        return <div>{":("} {JSON.stringify(posts.data)}</div>
    }

    return <div>
        {posts.data.data.items.map(item => {
            return <div key={item.revision_id}>
                <p><Link to={`/notes/${item.note_id}`}>{item.written_at}</Link>・{item.content_type}</p>
                <p>{item.summary}</p>
                <NoteContentRenderer note={item} />
            </div>
        })}
    </div>
}