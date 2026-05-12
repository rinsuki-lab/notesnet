import type { ComponentType } from "react"

export type NoteContents<C = unknown, A = unknown> = {
    content: C
    attributes: A
}

export type NoteContentEditorProps<T extends NoteContents> = T & {
    update: (next: T) => void
    disabled: boolean
    autoFocus?: boolean
}

export type NoteContentRenderModule<T extends NoteContents> = {
    contentType: string
    Renderer: ComponentType<T>
}

export type NoteContentEditModule<T extends NoteContents> = NoteContentRenderModule<T> & {
    Editor: ComponentType<NoteContentEditorProps<T>>
    computeTextForSearch: (props: T) => string
    canSubmit: (props: T) => boolean
    isEqual: (a: T, b: T) => boolean
    initialContents: () => T
}
