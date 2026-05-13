import type { NoteContents } from "../types"

export type TaskState = "current" | "paused" | "done"

export type TaskContents = NoteContents<
    { text: string },
    {
        state?: TaskState
        deadlineAt?: number
    }
>

export function isTaskState(value: string): value is TaskState {
    return value === "current" || value === "paused" || value === "done"
}
