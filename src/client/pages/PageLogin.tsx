import { useCreateSession } from "../api/internal"

export function PageLogin() {
    const login = useCreateSession({
        mutation: {
            onSuccess(data) {
                if (data.status === 200) {
                    localStorage.setItem("notesnet_token", data.data.accessToken)
                    location.reload()
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