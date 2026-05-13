import { useEffect, useRef } from "react"

import type { NoteContentEditorProps } from "../types"
import { pad2 } from "./datetime"
import { isTaskState, type TaskContents, type TaskState } from "./types"

import "./editor.css"

const STATE_OPTIONS = {
    "": "未設定",
    current: "current",
    paused: "paused",
    done: "done",
} satisfies Record<"" | TaskState, string>

function unixSecondsToDatetimeLocalValue(unixSeconds: number): string {
    const date = new Date(unixSeconds * 1000)
    if (Number.isNaN(date.getTime())) return ""
    const yyyy = date.getFullYear()
    const mm = pad2(date.getMonth() + 1)
    const dd = pad2(date.getDate())
    const hh = pad2(date.getHours())
    const mi = pad2(date.getMinutes())
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`
}

function datetimeLocalValueToUnixSeconds(value: string): number | undefined {
    if (value.length === 0) return undefined
    const ms = new Date(value).getTime()
    if (Number.isNaN(ms)) return undefined
    return Math.floor(ms / 1000)
}

export function NotesnetTaskEditor(props: NoteContentEditorProps<TaskContents>) {
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (!props.autoFocus) return
        const el = inputRef.current
        if (el == null) return
        el.focus()
        const len = el.value.length
        el.setSelectionRange(len, len)
    }, [props.autoFocus])

    const { state, deadlineAt } = props.attributes

    const updateAttributes = (next: TaskContents["attributes"]) => {
        props.update({
            content: props.content,
            attributes: next,
        })
    }

    return (
        <div className="notesnet-task-editor">
            <div className="notesnet-task-editor-meta">
                <select
                    value={state ?? ""}
                    disabled={props.disabled}
                    onChange={e => {
                        const v = e.currentTarget.value
                        const nextAttrs: TaskContents["attributes"] = { ...props.attributes }
                        if (isTaskState(v)) {
                            nextAttrs.state = v
                        } else {
                            delete nextAttrs.state
                        }
                        updateAttributes(nextAttrs)
                    }}
                >
                    {Object.entries(STATE_OPTIONS).map(([value, label]) => (
                        <option key={value} value={value}>
                            {label}
                        </option>
                    ))}
                </select>
                <label>
                    締切:{" "}
                    <input
                        type="datetime-local"
                        value={deadlineAt != null ? unixSecondsToDatetimeLocalValue(deadlineAt) : ""}
                        disabled={props.disabled}
                        onChange={e => {
                            const next = datetimeLocalValueToUnixSeconds(e.currentTarget.value)
                            const nextAttrs: TaskContents["attributes"] = { ...props.attributes }
                            if (next != null) {
                                nextAttrs.deadlineAt = next
                            } else {
                                delete nextAttrs.deadlineAt
                            }
                            updateAttributes(nextAttrs)
                        }}
                    />
                </label>
                {deadlineAt != null && (
                    <button
                        type="button"
                        disabled={props.disabled}
                        onClick={() => {
                            const nextAttrs: TaskContents["attributes"] = { ...props.attributes }
                            delete nextAttrs.deadlineAt
                            updateAttributes(nextAttrs)
                        }}
                    >
                        クリア
                    </button>
                )}
            </div>
            <input
                ref={inputRef}
                type="text"
                className="notesnet-task-editor-input"
                value={props.content.text}
                onChange={e =>
                    props.update({
                        content: { text: e.currentTarget.value },
                        attributes: props.attributes,
                    })
                }
                disabled={props.disabled}
                placeholder="タスク内容"
            />
        </div>
    )
}
