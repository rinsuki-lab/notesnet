import { useState } from "react"

import "./PageTreeUlDebug.css"
import { TreeUl } from "../components/TreeUl"

function Lis(props: { count: number; margin: number; padding: number }) {
    return (
        <>
            {Array.from({ length: props.count }, (_, i) => (
                <li key={i}>
                    <div
                        className="box"
                        style={{ margin: `${props.margin}px 0`, padding: `${props.padding}px` }}
                    >{`子${i + 1}`}</div>
                </li>
            ))}
        </>
    )
}

function OurSection(props: { first: number; second: number; count: number; padding: number }) {
    return (
        <section>
            <TreeUl start="bottom" firstMargin={props.first} secondMargin={props.second} innerPadding={props.padding}>
                <Lis count={props.count} margin={props.second} padding={props.padding} />
            </TreeUl>
            <div className="box" style={{ margin: `${props.first}px 0` }}>
                root
            </div>
            <TreeUl start="top" firstMargin={props.first} secondMargin={props.second} innerPadding={props.padding}>
                <Lis count={props.count} margin={props.second} padding={props.padding} />
            </TreeUl>
        </section>
    )
}

export function PageTreeUlDebug() {
    const [count, setCount] = useState(3)
    const [padding, setPadding] = useState(0)
    return (
        <div id="page-tree-ul-debug">
            <h1>TreeUl debug</h1>
            <div>
                <button onClick={() => setCount(c => c + 1)}>子を増やす</button>
                <button onClick={() => setCount(c => Math.max(0, c - 1))}>子を減らす</button>
            </div>
            <div>
                <button onClick={() => setPadding(p => p + 1)}>paddingを増やす</button>
                <button onClick={() => setPadding(p => Math.max(0, p - 1))} disabled={padding === 0}>
                    paddingを減らす
                </button>
            </div>
            <h2>first {">"} second</h2>
            <OurSection first={16} second={8} count={count} padding={padding} />
            <h2>first = second</h2>
            <OurSection first={8} second={8} count={count} padding={padding} />
        </div>
    )
}
