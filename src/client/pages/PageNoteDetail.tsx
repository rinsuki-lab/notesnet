import { useQuery } from "@apollo/client/react"
import { useState } from "react"
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

const queryNoteChildsOnly = graphql(`
    query GetNoteChilds($id: ID!) {
        note(id: $id) {
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

function ChildTree(props: {
    childs: NonNullable<ReturnType<NonNullable<(typeof queryNote)["__apiType"]>>["note"]>["childs"]
    infinity: boolean
}) {
    if (!props.childs.length) return null

    return (
        <TreeUl start="top" firstMargin={8} secondMargin={8} innerPadding={8}>
            {props.childs.map(
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
                                <GrandChildTree id={relation.child.id} infinity={props.infinity} />
                            )}
                        </li>
                    )
            )}
        </TreeUl>
    )
}

function GrandChildTreeInner({ id, infinity }: { id: string; infinity: boolean }) {
    const { data, loading, error } = useQuery(queryNoteChildsOnly, { variables: { id } })
    if (loading) return <div>Loading...</div>
    if (error || !data?.note) return <div>{id}</div>

    return <ChildTree childs={data.note.childs} infinity={infinity} />
}

function GrandChildTree(props: { id: string; infinity: boolean }) {
    const [mount, setMount] = useState(props.infinity)
    const [infinity, setInfinity] = useState(props.infinity)

    if (!mount) {
        return (
            <TreeUl start="top" firstMargin={8} secondMargin={8} innerPadding={0}>
                <li>
                    <button onClick={() => setMount(true)}>孫の顔を見る</button>
                    <button
                        onClick={() => {
                            setInfinity(true)
                            setMount(true)
                        }}
                    >
                        末代まで見る
                    </button>
                </li>
            </TreeUl>
        )
    }

    // なんかuseLazyQueryの型が変だったのでマウントを遅らせる形でごまかした (TODO: useLazyQuery が使えるならそっちを使うべき)
    return <GrandChildTreeInner id={props.id} infinity={infinity} />
}

export function PageNoteDetail() {
    const id = useParams().noteId!
    const { data, loading, error } = useQuery(queryNote, { variables: { id } })

    if (error || !data?.note) {
        if (loading) return <div>Loading...</div>
        return (
            <div>
                {":("} {error?.message}
            </div>
        )
    }

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
                <ChildTree childs={data.note.childs} infinity={false} />
            </div>
        )
    )
}
