function pad2(n: number): string {
    return n.toString().padStart(2, "0")
}

export function formatNoteDate(date: Date, now: Date = new Date()): string {
    const sameYear = date.getFullYear() === now.getFullYear()
    const sameDay = sameYear && date.getMonth() === now.getMonth() && date.getDate() === now.getDate()

    const hh = pad2(date.getHours())
    const mm = pad2(date.getMinutes())

    if (sameDay) {
        return `${hh}:${mm}`
    }

    const month = pad2(date.getMonth() + 1)
    const day = pad2(date.getDate())

    if (sameYear) {
        return `${month}/${day} ${hh}:${mm}`
    }

    return `${date.getFullYear()}/${month}/${day} ${hh}:${mm}`
}
