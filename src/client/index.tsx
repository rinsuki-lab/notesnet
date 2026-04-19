import { createRoot } from "react-dom/client"
import { BrowserRouter, Link, Route, Routes } from "react-router"
import { useCreateSession, useGetMe } from "./api/internal"
import { QueryClientProvider } from "@tanstack/react-query"
import { queryClient } from "./api/query-client"

function PageLogin() {
    const login = useCreateSession({
        mutation: {
            onSuccess(data) {
                if (data.status === 200) {
                    localStorage.setItem("notesnet_token", data.data.access_token)
                    queryClient.invalidateQueries()
                }
            }
        }
    })

    return <div>
        <form method="POST" onSubmit={e => {
            e.preventDefault()
            login.mutate({
                data: {
                    password: e.currentTarget.password.value,
                    username: e.currentTarget.username.value
                }
            })
        }}>
            <input type="text" name="username" placeholder="Username" />
            <input type="password" name="password" placeholder="Password" />
            <button type="submit">Login</button>
        </form>
    </div>
}

function Top() {
    const user = useGetMe()

    if (user.data == null) {
        return null
    }

    if (user.data.status !== 200) {
        return <div>
            <PageLogin />
        </div>
    }

    return <div>
        <div>
            Hello, {user.data.data.name}!
        </div>
    </div>
}

createRoot(document.getElementById("root")!).render(
    <BrowserRouter>
        <QueryClientProvider client={queryClient}>
            <Top />
        </QueryClientProvider>
    </BrowserRouter>
)