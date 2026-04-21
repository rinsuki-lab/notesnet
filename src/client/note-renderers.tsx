import { JSX } from "react"
import { ListNotesItem } from "./api/internal/schemas"

type TextPlainNote = ListNotesItem & {
    content: {
        text: string
    }
}

export const noteRenderers = {
    "text/plain": (note: ListNotesItem) => <p>{(note as TextPlainNote).content.text}</p>
} satisfies Record<string, (note: ListNotesItem) => JSX.Element>