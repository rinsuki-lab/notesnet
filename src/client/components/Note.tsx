import { useState } from "react"
import { Link } from "react-router"

import { ReplyButton } from "../contexts/ReplyContext"
import { NoteContentRenderer } from "./NoteContentRenderer"
import { NoteEditor } from "./NoteEditor"

import "./Note.css"

export function Note(props: {
    note: {
        id: string
        scope?: null | {
            permissions?: null | {
                canAddTheirNotesToChild: boolean
                canModifyNotes?: boolean
            }
        }
    }
    revision: {
        id: string
        summary?: string | null
        writtenAt: string
        contentType: string
        content: unknown
        attributes: unknown
    }
}) {
    const [editing, setEditing] = useState(false)
    const canModify = props.note.scope?.permissions?.canModifyNotes === true
    const isPlainText = props.revision.contentType === "text/plain"

    return (
        <div className="note">
            <div className="note-meta">
                <div className="note-meta-left">
                    {props.note.scope?.permissions?.canAddTheirNotesToChild ? <ReplyButton id={props.note.id} /> : null}
                    <Link to={`/notes/${props.note.id}`}>{props.revision.writtenAt}</Link>・{props.revision.contentType}
                </div>
                {canModify && !editing ? (
                    <button
                        type="button"
                        className="note-edit-button"
                        onClick={() => setEditing(true)}
                        disabled={!isPlainText}
                        title={isPlainText ? undefined : "text/plain 以外のノートはまだ編集できません"}
                    >
                        Edit
                    </button>
                ) : null}
            </div>
            {editing ? (
                <NoteEditor
                    key={props.revision.id}
                    note={props.note}
                    revision={props.revision}
                    onClose={() => setEditing(false)}
                />
            ) : (
                <>
                    <p>
                        <strong>{props.revision.summary}</strong>
                    </p>
                    <NoteContentRenderer note={props.revision} />
                </>
            )}
        </div>
    )
}
