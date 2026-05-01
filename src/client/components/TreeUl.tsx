import "./TreeUl.css"

export function TreeUl(props: {
    start: "top" | "bottom"
    children: React.ReactNode
    firstMargin: number
    secondMargin: number
    innerPadding: number
}) {
    return (
        <ul
            className={`tree tree-${props.start}-start`}
            style={
                {
                    "--tree-first-margin": `${props.firstMargin}px`,
                    "--tree-second-margin": `${props.secondMargin}px`,
                    "--tree-inner-padding": `${props.innerPadding}px`,
                } as any
            }
        >
            {props.children}
        </ul>
    )
}
