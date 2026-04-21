import { useListNotes } from "../api/internal"
import { noteRenderers } from "../note-renderers"

export function PageLatestPosts() {
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
                    item.content_type in noteRenderers
                        ? noteRenderers[item.content_type](item)
                        : <p>Unsupported content type: {item.content_type}</p>
                }
            </div>
        })}
    </div>
}