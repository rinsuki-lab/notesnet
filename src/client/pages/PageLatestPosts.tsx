import { Link } from "react-router"
import { graphql } from "../api/graphql"
import { useQuery } from "@apollo/client/react"
import { NoteContentRenderer } from "../components/NoteContentRenderer"

const queryRecentNotes = graphql(`
    query RecentNotes {
        recentNotes {
            id
            latestRevision {
                id
                summary
                writtenAt
                contentType
                content
                attributes
            }
        }
    }
`)

export function PageLatestPosts() {
    const { data, loading, error } = useQuery(queryRecentNotes)

    if (loading && !data) return <div>Loading...</div>
    if (error || !data) return <div>{":("} {error?.message}</div>

    return <div>
        {data.recentNotes.map(item => {
            const rev = item.latestRevision
            if (!rev) return null
            return <div key={rev.id}>
                <p><Link to={`/notes/${item.id}`}>{rev.writtenAt}</Link>・{rev.contentType}</p>
                <p>{rev.summary}</p>
                <NoteContentRenderer note={rev} />
            </div>
        })}
    </div>
}