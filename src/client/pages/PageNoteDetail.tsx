import { useQuery } from "@apollo/client/react"
import { useParams } from "react-router"

import { graphql } from "../api/graphql/index.ts"
import { Note } from "../components/Note.tsx"
import { SimpleNoteLink } from "../components/SimpleNoteLink.tsx"
import { TreeUl } from "../components/TreeUl.tsx"
import { ReplyButton } from "../contexts/ReplyContext.tsx"

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
            parents {
                parent {
                    id
                    latestRevision {
                        summary
                        textForSearch
                    }
                    scope {
                        permissions {
                            canAddTheirNotesToChild
                        }
                    }
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
                    childs {
                        child {
                            id
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
                <TreeUl start="bottom" firstMargin={8} secondMargin={8} innerPadding={0}>
                    {data.note.parents.map(
                        ({ parent }) =>
                            parent && (
                                <li key={parent.id}>
                                    <ReplyButton id={parent.id} />
                                    <SimpleNoteLink
                                        id={parent.id}
                                        summary={parent.latestRevision?.summary || ""}
                                        textForSearch={parent.latestRevision?.textForSearch || ""}
                                    />
                                </li>
                            )
                    )}
                </TreeUl>
                <Note note={data.note} revision={revision} />
                {data.note.childs.length > 0 && (
                    <TreeUl start="top" firstMargin={8} secondMargin={8} innerPadding={8}>
                        {data.note.childs.map(
                            relation =>
                                relation.child &&
                                relation.child.latestRevision && (
                                    <li>
                                        <Note
                                            key={relation.child.id}
                                            note={relation.child}
                                            revision={relation.child.latestRevision}
                                        />
                                        {relation.child.childs.length > 0 && (
                                            <TreeUl start="top" firstMargin={8} secondMargin={8} innerPadding={0}>
                                                <li>
                                                    <button>孫の顔を見る</button>
                                                </li>
                                            </TreeUl>
                                        )}
                                    </li>
                                )
                        )}
                    </TreeUl>
                )}
            </div>
        )
    )
}
