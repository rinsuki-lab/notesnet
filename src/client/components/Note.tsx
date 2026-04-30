import { Link } from "react-router"

import { ReplyButton } from "../contexts/ReplyContext"
import { NoteContentRenderer } from "./NoteContentRenderer"

import "./Note.css"

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
        <div className="note">
            <div>
                {props.note.scope?.permissions?.canAddTheirNotesToChild ? <ReplyButton id={props.note.id} /> : null}
                <Link to={`/notes/${props.note.id}`}>{props.revision.writtenAt}</Link>・{props.revision.contentType}
            </div>
            <div>{props.revision.summary}</div>
            <NoteContentRenderer note={props.revision} />
        </div>
    )
}
