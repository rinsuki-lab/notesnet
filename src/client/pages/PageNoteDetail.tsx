import { useParams } from "react-router";
import { graphql } from "../api/graphql";
import { useQuery } from "@apollo/client/react";
import { NoteContentRenderer } from "../components/NoteContentRenderer";

const queryNote = graphql(`
    query GetNote($id: UUID!) {
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
        }
    }
`);

export function PageNoteDetail() {
    const id = useParams().noteId!;
    const { data, loading, error } = useQuery(queryNote, { variables: { id } });

    if (loading) return <div>Loading...</div>;
    if (error || !data?.note) return <div>{":("} {error?.message}</div>;

    const revision = data.note.latestRevision;
    return revision && <div>
        <h2>{revision.summary}</h2>
        <p>{revision.writtenAt}</p>
        <NoteContentRenderer note={{ content_type: revision.contentType, content: revision.content, attributes: revision.attributes }} />
    </div>;
}
