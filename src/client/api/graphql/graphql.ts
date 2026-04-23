/* eslint-disable */
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = T | null | undefined;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  /**
   * Implement the DateTime<Utc> scalar
   *
   * The input/output is a string in RFC3339 format.
   */
  DateTime: { input: any; output: any; }
  /** A scalar that can represent any JSON value. */
  JSON: { input: any; output: any; }
  /**
   * A UUID is a unique 128-bit number, stored as 16 octets. UUIDs are parsed as
   * Strings within GraphQL. UUIDs are used to assign unique identifiers to
   * entities without requiring a central allocating authority.
   *
   * # References
   *
   * * [Wikipedia: Universally Unique Identifier](http://en.wikipedia.org/wiki/Universally_unique_identifier)
   * * [RFC4122: A Universally Unique Identifier (UUID) URN Namespace](http://tools.ietf.org/html/rfc4122)
   */
  UUID: { input: any; output: any; }
};

export type Note = {
  __typename?: 'Note';
  external?: Maybe<NoteExternal>;
  id: Scalars['UUID']['output'];
  latestRevision?: Maybe<NoteRevision>;
};

export type NoteExternal = {
  __typename?: 'NoteExternal';
  id: Scalars['String']['output'];
  service: Scalars['String']['output'];
};

export type NoteRevision = {
  __typename?: 'NoteRevision';
  attributes: Scalars['JSON']['output'];
  content: Scalars['JSON']['output'];
  contentType: Scalars['String']['output'];
  id: Scalars['UUID']['output'];
  insertedAt: Scalars['DateTime']['output'];
  startedAt?: Maybe<Scalars['DateTime']['output']>;
  summary?: Maybe<Scalars['String']['output']>;
  textForSearch: Scalars['String']['output'];
  writtenAt: Scalars['DateTime']['output'];
};

export type Query = {
  __typename?: 'Query';
  note?: Maybe<Note>;
  viewer: Viewer;
};


export type QueryNoteArgs = {
  id: Scalars['UUID']['input'];
};

export type ScopePermissions = {
  __typename?: 'ScopePermissions';
  canAddTheirNotesToChild: Scalars['Boolean']['output'];
  canModifyNotes: Scalars['Boolean']['output'];
  canReadNoteRevisions: Scalars['Boolean']['output'];
};

export type Viewer = {
  __typename?: 'Viewer';
  id: Scalars['UUID']['output'];
  name: Scalars['String']['output'];
  scopes: Array<ViewerScope>;
};

export type ViewerScope = {
  __typename?: 'ViewerScope';
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
  permissions: ScopePermissions;
};

export type MyQueryVariables = Exact<{ [key: string]: never; }>;


export type MyQuery = { __typename?: 'Query', viewer: { __typename?: 'Viewer', id: any, name: string } };

export type MyScopesQueryVariables = Exact<{ [key: string]: never; }>;


export type MyScopesQuery = { __typename?: 'Query', viewer: { __typename?: 'Viewer', scopes: Array<{ __typename?: 'ViewerScope', id: string, name: string }> } };

export type GetNoteQueryVariables = Exact<{
  id: Scalars['UUID']['input'];
}>;


export type GetNoteQuery = { __typename?: 'Query', note?: { __typename?: 'Note', id: any, latestRevision?: { __typename?: 'NoteRevision', id: any, summary?: string | null, writtenAt: any, contentType: string, content: any, attributes: any } | null } | null };


export const MyDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"My"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"viewer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<MyQuery, MyQueryVariables>;
export const MyScopesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MyScopes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"viewer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"scopes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<MyScopesQuery, MyScopesQueryVariables>;
export const GetNoteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetNote"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"note"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"latestRevision"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"summary"}},{"kind":"Field","name":{"kind":"Name","value":"writtenAt"}},{"kind":"Field","name":{"kind":"Name","value":"contentType"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"attributes"}}]}}]}}]}}]} as unknown as DocumentNode<GetNoteQuery, GetNoteQueryVariables>;