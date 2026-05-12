import { useEffect, useRef } from "react"

import "./text-plain.css"
import type { NoteContentEditModule, NoteContentEditorProps, NoteContents } from "./types"

type TextPlainContents = NoteContents<{ text: string }, Record<string, never>>

function TextPlainRenderer(props: TextPlainContents) {
    return <p style={{ whiteSpace: "pre-wrap" }}>{props.content.text}</p>
}

function TextPlainEditor(props: NoteContentEditorProps<TextPlainContents>) {
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    useEffect(() => {
        if (!props.autoFocus) return
        const el = textareaRef.current
        if (el == null) return
        el.focus()
        const len = el.value.length
        el.setSelectionRange(len, len)
    }, [props.autoFocus])

    return (
        <textarea
            ref={textareaRef}
            className="text-plain-textarea"
            value={props.content.text}
            onChange={e =>
                props.update({
                    content: { text: e.currentTarget.value },
                    attributes: props.attributes,
                })
            }
            disabled={props.disabled}
        />
    )
}

export const textPlainModule: NoteContentEditModule<TextPlainContents> = {
    contentType: "text/plain",
    Renderer: TextPlainRenderer,
    Editor: TextPlainEditor,
    computeTextForSearch({ content }) {
        return content.text
    },
    canSubmit({ content }) {
        return content.text.trim().length > 0
    },
    isEqual(a, b) {
        return a.content.text === b.content.text
    },
    initialContents() {
        return { content: { text: "" }, attributes: {} }
    },
}
