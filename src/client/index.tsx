import { ApolloClient } from "@apollo/client"
import { HttpLink } from "@apollo/client"
import { InMemoryCache } from "@apollo/client"
import { ApolloProvider } from "@apollo/client/react"
import { QueryClientProvider } from "@tanstack/react-query"
import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router"

import { queryClient } from "./api/query-client"
import { App } from "./App"

const client = new ApolloClient({
    link: new HttpLink({
        uri: "/api/v1/graphql",
        fetch(input, init) {
            if (typeof input === "string" && init?.body != null && typeof init.body === "string") {
                const body = JSON.parse(init.body)
                input += "#" + body.operationName
            }
            const req = new Request(input, init)
            const token = localStorage.getItem("notesnet_token")
            if (token) {
                req.headers.set("Authorization", `Bearer ${token}`)
            }
            return fetch(req)
        },
    }),
    cache: new InMemoryCache(),
})

createRoot(document.getElementById("root")!).render(
    <BrowserRouter>
        <ApolloProvider client={client}>
            <QueryClientProvider client={queryClient}>
                <App />
            </QueryClientProvider>
        </ApolloProvider>
    </BrowserRouter>
)
