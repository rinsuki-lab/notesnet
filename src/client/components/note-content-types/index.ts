import { notesnetTaskModule } from "./notesnet-task"
import { textPlainModule } from "./text-plain"
import type { NoteContentEditModule, NoteContentRenderModule, NoteContents } from "./types"

export const editableNoteContentTypes: Record<string, NoteContentEditModule<NoteContents>> = {
    "text/plain": textPlainModule as NoteContentEditModule<NoteContents>,
    "notesnet/task": notesnetTaskModule as NoteContentEditModule<NoteContents>,
}

export const noteContentTypes: Record<
    string,
    NoteContentRenderModule<NoteContents> | NoteContentEditModule<NoteContents>
> = {
    ...editableNoteContentTypes,
}

export const defaultComposeContentType = "text/plain"

export type { NoteContentEditModule, NoteContentEditorProps, NoteContentRenderModule, NoteContents } from "./types"
