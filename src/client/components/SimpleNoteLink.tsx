import { useQuery } from "@apollo/client/react"
import { Link } from "react-router"

import { graphql } from "../api/graphql"

export const SimpleNoteLink = (props: { id: string; summary: string; textForSearch: string }) => {
    return (
        <Link to={`/notes/${props.id}`}>
            {props.summary.length ? (
                <strong>
                    {props.summary}
                    {props.textForSearch.length ? " " : ""}
                </strong>
            ) : null}
            {props.textForSearch}
        </Link>
    )
}

const querySimpleNoteLinkFromId = graphql(`
    query SimpleNoteLinkFromId($id: ID!) {
        note(id: $id) {
            id
            latestRevision {
                summary
                textForSearch
            }
        }
    }
`)

export const SimpleNoteLinkFromId = (props: { id: string }) => {
    const { data, loading, error } = useQuery(querySimpleNoteLinkFromId, {
        variables: { id: props.id },
    })

    if (loading) return <span>Loading...</span>
    if (error || !data?.note) return <span>{props.id}</span>

    const rev = data.note.latestRevision
    return <SimpleNoteLink id={data.note.id} summary={rev?.summary || ""} textForSearch={rev?.textForSearch || ""} />
}
