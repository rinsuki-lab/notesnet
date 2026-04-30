import { Link } from "react-router"

import { ReplyButton } from "../contexts/ReplyContext"
import { NoteContentRenderer } from "./NoteContentRenderer"

export function Note(props: {
    note: {
        id: string
        scope?: null | {
            permissions?: null | {
                canAddTheirNotesToChild: boolean
            }
        }
    }
    revision: {
        summary?: string | null
        writtenAt: string
        contentType: string
        content: unknown
        attributes: unknown
    }
}) {
    return (
        <div>
            <p>
                {props.note.scope?.permissions?.canAddTheirNotesToChild ? <ReplyButton id={props.note.id} /> : null}
                <Link to={`/notes/${props.note.id}`}>{props.revision.writtenAt}</Link>・{props.revision.contentType}
            </p>
            <p>{props.revision.summary}</p>
            <NoteContentRenderer note={props.revision} />
        </div>
    )
}
