import { useQuery } from "@apollo/client/react"
import { Link } from "react-router"

import { graphql } from "../api/graphql"
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
            parents {
                parent {
                    id
                    latestRevision {
                        summary
                        textForSearch
                    }
                }
            }
        }
    }
`)

export function PageLatestPosts() {
    const { data, loading, error } = useQuery(queryRecentNotes)

    if (loading && !data) return <div>Loading...</div>
    if (error || !data)
        return (
            <div>
                {":("} {error?.message}
            </div>
        )

    return (
        <div>
            {data.recentNotes.map(item => {
                const parents = item.parents.map(p => p.parent).filter(p => p != null)
                const rev = item.latestRevision
                if (!rev) return null
                return (
                    <div key={rev.id}>
                        <hr />
                        {parents.map((parent, i) => (
                            <div key={parent.id}>
                                {i ? "├" : "┌"}親:{" "}
                                <Link to={`/notes/${parent.id}`}>
                                    <strong>{parent.latestRevision?.summary}</strong>
                                    {parent.latestRevision?.textForSearch}
                                </Link>
                            </div>
                        ))}
                        <p>
                            <Link to={`/notes/${item.id}`}>{rev.writtenAt}</Link>・{rev.contentType}
                        </p>
                        <p>{rev.summary}</p>
                        <NoteContentRenderer note={rev} />
                    </div>
                )
            })}
        </div>
    )
}
