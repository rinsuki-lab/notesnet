import { useQuery } from "@apollo/client/react"
import { useParams } from "react-router"

import { graphql } from "../api/graphql/index.ts"
import { Note } from "../components/Note.tsx"

const queryNote = graphql(`
    query GetNote($id: ID!) {
        note(id: $id) {
            id
            latestRevision {
                id
                summary
                writtenAt
                contentType
                content
                attributes
            }
            scope {
                permissions {
                    canAddTheirNotesToChild
                }
            }
            childs {
                child {
                    id
                    latestRevision {
                        id
                        summary
                        writtenAt
                        contentType
                        content
                        attributes
                    }
                    scope {
                        permissions {
                            canAddTheirNotesToChild
                        }
                    }
                }
            }
        }
    }
`)

export function PageNoteDetail() {
    const id = useParams().noteId!
    const { data, loading, error } = useQuery(queryNote, { variables: { id } })

    if (loading) return <div>Loading...</div>
    if (error || !data?.note)
        return (
            <div>
                {":("} {error?.message}
            </div>
        )

    const revision = data.note.latestRevision
    return (
        revision && (
            <div>
                <Note note={data.note} revision={revision} />
                {data.note.childs.length > 0 && (
                    <div>
                        <h2>Child Notes</h2>
                        {data.note.childs.map(
                            relation =>
                                relation.child &&
                                relation.child.latestRevision && (
                                    <Note
                                        key={relation.child.id}
                                        note={relation.child}
                                        revision={relation.child.latestRevision}
                                    />
                                )
                        )}
                    </div>
                )}
            </div>
        )
    )
}
