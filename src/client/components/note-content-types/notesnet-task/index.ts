import type { NoteContentEditModule } from "../types"
import { NotesnetTaskEditor } from "./editor"
import { NotesnetTaskRenderer } from "./render"
import type { TaskContents } from "./types"

export const notesnetTaskModule: NoteContentEditModule<TaskContents> = {
    contentType: "notesnet/task",
    Renderer: NotesnetTaskRenderer,
    Editor: NotesnetTaskEditor,
    computeTextForSearch({ content }) {
        return content.text
    },
    canSubmit({ content }) {
        return content.text.trim().length > 0
    },
    isEqual(a, b) {
        return (
            a.content.text === b.content.text &&
            a.attributes.state === b.attributes.state &&
            a.attributes.deadlineAt === b.attributes.deadlineAt
        )
    },
    initialContents() {
        return { content: { text: "" }, attributes: {} }
    },
}
