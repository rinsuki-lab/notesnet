import { createContext, ReactNode, useContext, useState } from "react"

export const ReplyContext = createContext<null | [string[], React.Dispatch<React.SetStateAction<string[]>>]>(null)

export const ReplyButton = (props: { id: string }) => {
    const context = useContext(ReplyContext)
    if (context == null) return null

    const replyAlreadyIncluded = context[0].includes(props.id)

    return (
        <span>
            <button
                onClick={() => {
                    context[1]([props.id])
                }}
                disabled={replyAlreadyIncluded}
            >
                Reply
            </button>
            <button
                onClick={() => {
                    context[1](ids => [...ids, props.id])
                }}
                disabled={replyAlreadyIncluded}
            >
                +
            </button>
        </span>
    )
}

export const ReplyContextProvider = (props: { children: ReactNode }) => {
    const state = useState<string[]>(() => [])
    return <ReplyContext.Provider value={state}>{props.children}</ReplyContext.Provider>
}
