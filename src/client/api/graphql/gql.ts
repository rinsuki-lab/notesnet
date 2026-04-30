/* eslint-disable */
import * as types from './graphql';
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
type Documents = {
    "\n    query My {\n        viewer {\n            id\n            name\n        }\n    }\n": typeof types.MyDocument,
    "\n    query MyScopes {\n        viewer {\n            scopes {\n                id\n                name\n                permissions {\n                    canModifyNotes\n                }\n            }\n        }\n    }\n": typeof types.MyScopesDocument,
    "\n    mutation CreateNewNote($input: CreateNewNoteInput!) {\n        createNewNote(input: $input) {\n            id\n        }\n    }\n": typeof types.CreateNewNoteDocument,
    "\n    query SimpleNoteLinkFromId($id: ID!) {\n        note(id: $id) {\n            id\n            latestRevision {\n                summary\n                textForSearch\n            }\n        }\n    }\n": typeof types.SimpleNoteLinkFromIdDocument,
    "\n    query RecentNotes {\n        recentNotes {\n            id\n            scope {\n                permissions {\n                    canAddTheirNotesToChild\n                }\n            }\n            latestRevision {\n                id\n                summary\n                writtenAt\n                contentType\n                content\n                attributes\n            }\n            parents {\n                parent {\n                    id\n                    latestRevision {\n                        summary\n                        textForSearch\n                    }\n                }\n            }\n        }\n    }\n": typeof types.RecentNotesDocument,
    "\n    query GetNote($id: ID!) {\n        note(id: $id) {\n            id\n            latestRevision {\n                id\n                summary\n                writtenAt\n                contentType\n                content\n                attributes\n            }\n            scope {\n                permissions {\n                    canAddTheirNotesToChild\n                }\n            }\n        }\n    }\n": typeof types.GetNoteDocument,
};
const documents: Documents = {
    "\n    query My {\n        viewer {\n            id\n            name\n        }\n    }\n": types.MyDocument,
    "\n    query MyScopes {\n        viewer {\n            scopes {\n                id\n                name\n                permissions {\n                    canModifyNotes\n                }\n            }\n        }\n    }\n": types.MyScopesDocument,
    "\n    mutation CreateNewNote($input: CreateNewNoteInput!) {\n        createNewNote(input: $input) {\n            id\n        }\n    }\n": types.CreateNewNoteDocument,
    "\n    query SimpleNoteLinkFromId($id: ID!) {\n        note(id: $id) {\n            id\n            latestRevision {\n                summary\n                textForSearch\n            }\n        }\n    }\n": types.SimpleNoteLinkFromIdDocument,
    "\n    query RecentNotes {\n        recentNotes {\n            id\n            scope {\n                permissions {\n                    canAddTheirNotesToChild\n                }\n            }\n            latestRevision {\n                id\n                summary\n                writtenAt\n                contentType\n                content\n                attributes\n            }\n            parents {\n                parent {\n                    id\n                    latestRevision {\n                        summary\n                        textForSearch\n                    }\n                }\n            }\n        }\n    }\n": types.RecentNotesDocument,
    "\n    query GetNote($id: ID!) {\n        note(id: $id) {\n            id\n            latestRevision {\n                id\n                summary\n                writtenAt\n                contentType\n                content\n                attributes\n            }\n            scope {\n                permissions {\n                    canAddTheirNotesToChild\n                }\n            }\n        }\n    }\n": types.GetNoteDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = graphql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function graphql(source: string): unknown;

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n    query My {\n        viewer {\n            id\n            name\n        }\n    }\n"): (typeof documents)["\n    query My {\n        viewer {\n            id\n            name\n        }\n    }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n    query MyScopes {\n        viewer {\n            scopes {\n                id\n                name\n                permissions {\n                    canModifyNotes\n                }\n            }\n        }\n    }\n"): (typeof documents)["\n    query MyScopes {\n        viewer {\n            scopes {\n                id\n                name\n                permissions {\n                    canModifyNotes\n                }\n            }\n        }\n    }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n    mutation CreateNewNote($input: CreateNewNoteInput!) {\n        createNewNote(input: $input) {\n            id\n        }\n    }\n"): (typeof documents)["\n    mutation CreateNewNote($input: CreateNewNoteInput!) {\n        createNewNote(input: $input) {\n            id\n        }\n    }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n    query SimpleNoteLinkFromId($id: ID!) {\n        note(id: $id) {\n            id\n            latestRevision {\n                summary\n                textForSearch\n            }\n        }\n    }\n"): (typeof documents)["\n    query SimpleNoteLinkFromId($id: ID!) {\n        note(id: $id) {\n            id\n            latestRevision {\n                summary\n                textForSearch\n            }\n        }\n    }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n    query RecentNotes {\n        recentNotes {\n            id\n            scope {\n                permissions {\n                    canAddTheirNotesToChild\n                }\n            }\n            latestRevision {\n                id\n                summary\n                writtenAt\n                contentType\n                content\n                attributes\n            }\n            parents {\n                parent {\n                    id\n                    latestRevision {\n                        summary\n                        textForSearch\n                    }\n                }\n            }\n        }\n    }\n"): (typeof documents)["\n    query RecentNotes {\n        recentNotes {\n            id\n            scope {\n                permissions {\n                    canAddTheirNotesToChild\n                }\n            }\n            latestRevision {\n                id\n                summary\n                writtenAt\n                contentType\n                content\n                attributes\n            }\n            parents {\n                parent {\n                    id\n                    latestRevision {\n                        summary\n                        textForSearch\n                    }\n                }\n            }\n        }\n    }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n    query GetNote($id: ID!) {\n        note(id: $id) {\n            id\n            latestRevision {\n                id\n                summary\n                writtenAt\n                contentType\n                content\n                attributes\n            }\n            scope {\n                permissions {\n                    canAddTheirNotesToChild\n                }\n            }\n        }\n    }\n"): (typeof documents)["\n    query GetNote($id: ID!) {\n        note(id: $id) {\n            id\n            latestRevision {\n                id\n                summary\n                writtenAt\n                contentType\n                content\n                attributes\n            }\n            scope {\n                permissions {\n                    canAddTheirNotesToChild\n                }\n            }\n        }\n    }\n"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;