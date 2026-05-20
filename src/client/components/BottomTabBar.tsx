import { type MouseEvent } from "react"
import { NavLink, useLocation } from "react-router"

import "./BottomTabBar.css"

type Props = {
    composeOpen: boolean
    onToggleCompose: () => void
}

export function BottomTabBar({ composeOpen, onToggleCompose }: Props) {
    const location = useLocation()

    const handleNavClick = (to: string) => (e: MouseEvent<HTMLAnchorElement>) => {
        if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
            return
        }
        if (location.pathname === to) {
            e.preventDefault()
            window.scrollTo({
                top: document.documentElement.scrollHeight,
                behavior: "smooth",
            })
        }
    }

    return (
        <nav className="bottom-tab-bar">
            <NavLink
                to="/"
                end
                className={({ isActive }) => "tab" + (isActive ? " active" : "")}
                onClick={handleNavClick("/")}
            >
                ホーム
            </NavLink>
            <NavLink
                to="/tasks"
                className={({ isActive }) => "tab" + (isActive ? " active" : "")}
                onClick={handleNavClick("/tasks")}
            >
                タスク
            </NavLink>
            <button type="button" className={"tab" + (composeOpen ? " active" : "")} onClick={onToggleCompose}>
                投稿
            </button>
        </nav>
    )
}
