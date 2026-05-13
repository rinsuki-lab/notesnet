import { useEffect, useState } from "react"

import { pad2 } from "./datetime"
import type { TaskContents } from "./types"

import "./render.css"

const SECOND_MS = 1000
const MINUTE_MS = 60 * SECOND_MS
const HOUR_MS = 60 * MINUTE_MS
const DAY_MS = 24 * HOUR_MS

function formatDeadline(unixSeconds: number): string {
    const date = new Date(unixSeconds * 1000)
    if (Number.isNaN(date.getTime())) return ""
    return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())} ${pad2(date.getHours())}:${pad2(date.getMinutes())}`
}

function formatRelativeFromNow(targetMs: number, nowMs: number): { text: string; nextChangeInMs: number } {
    const diffMs = targetMs - nowMs
    const absMs = Math.abs(diffMs)
    const suffix = diffMs >= 0 ? "後" : "前"

    const { unitMs, value, label } = (() => {
        if (absMs < 2 * MINUTE_MS) return { unitMs: SECOND_MS, value: Math.floor(absMs / SECOND_MS), label: "秒" }
        if (absMs < 2 * HOUR_MS) return { unitMs: MINUTE_MS, value: Math.floor(absMs / MINUTE_MS), label: "分" }
        if (absMs < 2 * DAY_MS) return { unitMs: HOUR_MS, value: Math.floor(absMs / HOUR_MS), label: "時間" }
        return { unitMs: DAY_MS, value: Math.floor(absMs / DAY_MS), label: "日" }
    })()

    const nextChangeInMs = diffMs >= 0 ? Math.max(100, absMs % unitMs) : Math.max(100, unitMs - (absMs % unitMs))
    return { text: `${value}${label}${suffix}`, nextChangeInMs }
}

export function NotesnetTaskRenderer(props: TaskContents) {
    const { text } = props.content
    const { state, deadlineAt } = props.attributes
    const isDone = state === "done"
    const [now, setNow] = useState(() => Date.now())

    const relative = deadlineAt != null ? formatRelativeFromNow(deadlineAt * 1000, now) : null

    useEffect(() => {
        if (relative == null || isDone) return
        const timer = setTimeout(() => setNow(Date.now()), relative.nextChangeInMs)
        return () => clearTimeout(timer)
    }, [now, isDone, deadlineAt, relative?.nextChangeInMs])

    const isOverdue = deadlineAt != null && !isDone && deadlineAt * 1000 < now

    return (
        <div className="notesnet-task-renderer">
            <span className={`notesnet-task-state-badge${state ? ` state-${state}` : ""}`}>{state ?? "未設定"}</span>
            <div className="notesnet-task-renderer-body">
                {deadlineAt != null && relative != null && (
                    <span className={`notesnet-task-deadline${isOverdue ? " is-overdue" : ""}`}>
                        ⏰ {formatDeadline(deadlineAt)} ({relative.text})
                    </span>
                )}
                <span className={`notesnet-task-renderer-text${isDone ? " is-done" : ""}`}>{text}</span>
            </div>
        </div>
    )
}
