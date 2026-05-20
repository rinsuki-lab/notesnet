import { useQuery } from "@apollo/client/react"

import { type DocumentType, graphql } from "../api/graphql"
import { Note } from "../components/Note"
import { SimpleNoteLink } from "../components/SimpleNoteLink"
import { TreeUl } from "../components/TreeUl"
import { ReplyButton } from "../contexts/ReplyContext"
import { useStickToBottom } from "../utils/use-stick-to-bottom"

const queryRecentNotes = graphql(`
    query RecentNotes {
        recentNotes {
            id
            scope {
                permissions {
                    canAddTheirNotesToChild
                    canModifyNotes
                }
            }
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

type RecentNote = DocumentType<typeof queryRecentNotes>["recentNotes"][number]
type RenderableRecentNote = RecentNote & {
    latestRevision: NonNullable<RecentNote["latestRevision"]>
}
type ChildTreeNode = {
    note: RenderableRecentNote
    children: ChildTreeNode[]
}

function collectChildTrees(notes: RecentNote[], parentId: string, startIndex: number) {
    const nodes: ChildTreeNode[] = []
    let index = startIndex

    while (index < notes.length) {
        const note = notes[index]
        if (note == null) break
        if (note.latestRevision == null) break
        if (note.parents.length !== 1) break
        if (note.parents[0]?.parent?.id !== parentId) break

        const renderableNote = note as RenderableRecentNote
        const { nodes: children, nextIndex } = collectChildTrees(notes, note.id, index + 1)
        nodes.push({ note: renderableNote, children })
        index = nextIndex
    }

    return { nodes, nextIndex: index }
}

function renderChildTrees(nodes: ChildTreeNode[]) {
    if (!nodes.length) return null

    return (
        <TreeUl start="top" firstMargin={8} secondMargin={8} innerPadding={8}>
            {nodes.map(({ note, children }) => (
                <li key={note.id}>
                    <Note note={note} revision={note.latestRevision} />
                    {renderChildTrees(children)}
                </li>
            ))}
        </TreeUl>
    )
}

export function PageLatestPosts() {
    const { data, loading, error } = useQuery(queryRecentNotes)

    useStickToBottom(data != null)

    if (loading && !data) return <div>Loading...</div>
    if (error || !data)
        return (
            <div>
                {":("} {error?.message}
            </div>
        )

    const reversedNotes = data.recentNotes.toReversed()
    const noteBlocks = []

    for (let index = 0; index < reversedNotes.length; index++) {
        const note = reversedNotes[index]
        if (note == null) continue
        const parents = note.parents.map(p => p.parent).filter(p => p != null)
        const rev = note.latestRevision
        if (!rev) continue

        const { nodes: childTrees, nextIndex } = collectChildTrees(reversedNotes, note.id, index + 1)
        noteBlocks.push(
            <div key={rev.id}>
                <TreeUl start="bottom" firstMargin={8} secondMargin={8} innerPadding={0}>
                    {parents.map(parent => (
                        <li key={parent.id}>
                            <ReplyButton id={parent.id} />
                            <SimpleNoteLink
                                id={parent.id}
                                summary={parent.latestRevision?.summary || ""}
                                textForSearch={parent.latestRevision?.textForSearch || ""}
                            />
                        </li>
                    ))}
                </TreeUl>
                <Note note={note} revision={rev} />
                {renderChildTrees(childTrees)}
            </div>
        )
        index = nextIndex - 1
    }

    return <div>{noteBlocks}</div>
}
