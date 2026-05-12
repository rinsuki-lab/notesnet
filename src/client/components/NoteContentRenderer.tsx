import { noteContentTypes } from "./note-content-types"

type NoteContent = {
    contentType: string
    content: unknown
    attributes: unknown
}

export const NoteContentRenderer = (props: { note: NoteContent }) => {
    const module = noteContentTypes[props.note.contentType]
    if (module == null) {
        return <p>Unsupported content type: {props.note.contentType}</p>
    }
    const { Renderer } = module
    return <Renderer content={props.note.content} attributes={props.note.attributes} />
}
