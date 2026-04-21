import { useParams } from "react-router";
import { useGetNote } from "../api/internal";
import { NoteContentRenderer } from "../components/NoteContentRenderer";

export function PageNoteDetail() {
    const id = useParams().noteId
    const note = useGetNote(id!)

    if (note.data?.status !== 200) {
        return <div>{":("} {JSON.stringify(note.data)}</div>
    }

    return <div>
        <h2>{note.data.data.summary}</h2>
        <p>{note.data.data.written_at}</p>
        <NoteContentRenderer note={note.data.data} />
    </div>
}