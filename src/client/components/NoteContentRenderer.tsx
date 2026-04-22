import { JSX } from "react"

type NoteContent = {
    content_type: string,
    content: unknown,
    attributes: unknown,
}

type TextPlainNote = NoteContent & {
    content: {
        text: string
    }
}

const noteRenderers = {
    "text/plain": (props: { note: NoteContent }) => <p style={{whiteSpace: "pre-wrap"}}>{(props.note as TextPlainNote).content.text}</p>
} as Partial<Record<string, (props: { note: NoteContent }) => JSX.Element>>

export const NoteContentRenderer = (props: { note: NoteContent}) => {
    const Renderer = noteRenderers[props.note.content_type]
    if (Renderer == null) {
        return <p>Unsupported content type: {props.note.content_type}</p>
    }
    return <Renderer note={props.note} />
}