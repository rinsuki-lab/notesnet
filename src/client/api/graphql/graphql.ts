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
  /** A date-time string at UTC, such as 2007-12-03T10:15:30Z, compliant with the `date-time` format outlined in section 5.6 of the RFC 3339 profile of the ISO 8601 standard for representation of dates and times using the Gregorian calendar.This scalar is serialized to a string in ISO 8601 format and parsed from a string in ISO 8601 format. */
  DateTime: { input: any; output: any; }
  /** The `JSON` scalar type represents JSON values as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
  JSON: { input: any; output: any; }
};

export type CreateNewNoteInput = {
  attributes: Scalars['JSON']['input'];
  content: Scalars['JSON']['input'];
  contentType: Scalars['String']['input'];
  parents?: InputMaybe<Array<CreateNewNoteParentInput>>;
  scopeId: Scalars['ID']['input'];
  startedAt?: InputMaybe<Scalars['DateTime']['input']>;
  summary?: InputMaybe<Scalars['String']['input']>;
  textForSearch: Scalars['String']['input'];
  writtenAt?: InputMaybe<Scalars['DateTime']['input']>;
};

export type CreateNewNoteParentInput = {
  noteId: Scalars['ID']['input'];
  order?: InputMaybe<Scalars['Int']['input']>;
  shouldListedAsChild?: Scalars['Boolean']['input'];
  shouldListedAsParent?: Scalars['Boolean']['input'];
};

export type Mutation = {
  __typename?: 'Mutation';
  createNewNote: Note;
};


export type MutationCreateNewNoteArgs = {
  input: CreateNewNoteInput;
};

export type Note = {
  __typename?: 'Note';
  childs: Array<NoteRelation>;
  external?: Maybe<NoteExternal>;
  id: Scalars['ID']['output'];
  latestRevision?: Maybe<NoteRevision>;
  parents: Array<NoteRelation>;
  scope?: Maybe<Scope>;
};

export type NoteExternal = {
  __typename?: 'NoteExternal';
  id: Scalars['String']['output'];
  service: Scalars['String']['output'];
};

export type NoteRelation = {
  __typename?: 'NoteRelation';
  child?: Maybe<Note>;
  parent?: Maybe<Note>;
};

export type NoteRevision = {
  __typename?: 'NoteRevision';
  attributes: Scalars['JSON']['output'];
  content: Scalars['JSON']['output'];
  contentType: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  insertedAt: Scalars['DateTime']['output'];
  startedAt?: Maybe<Scalars['DateTime']['output']>;
  summary?: Maybe<Scalars['String']['output']>;
  textForSearch: Scalars['String']['output'];
  writtenAt: Scalars['DateTime']['output'];
};

export type Query = {
  __typename?: 'Query';
  note?: Maybe<Note>;
  recentNotes: Array<Note>;
  viewer: Viewer;
};


export type QueryNoteArgs = {
  id: Scalars['ID']['input'];
};

export type Scope = {
  __typename?: 'Scope';
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  permissions?: Maybe<ScopePermission>;
};

export type ScopePermission = {
  __typename?: 'ScopePermission';
  canAddTheirNotesToChild: Scalars['Boolean']['output'];
  canModifyNotes: Scalars['Boolean']['output'];
  canReadNoteRevisions: Scalars['Boolean']['output'];
};

export type Viewer = {
  __typename?: 'Viewer';
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  scopes: Array<Scope>;
};

export type MyQueryVariables = Exact<{ [key: string]: never; }>;


export type MyQuery = { __typename?: 'Query', viewer: { __typename?: 'Viewer', id: string, name: string } };

export type MyScopesQueryVariables = Exact<{ [key: string]: never; }>;


export type MyScopesQuery = { __typename?: 'Query', viewer: { __typename?: 'Viewer', scopes: Array<{ __typename?: 'Scope', id: string, name: string, permissions?: { __typename?: 'ScopePermission', canModifyNotes: boolean } | null }> } };

export type CreateNewNoteMutationVariables = Exact<{
  input: CreateNewNoteInput;
}>;


export type CreateNewNoteMutation = { __typename?: 'Mutation', createNewNote: { __typename?: 'Note', id: string } };

export type SimpleNoteLinkFromIdQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type SimpleNoteLinkFromIdQuery = { __typename?: 'Query', note?: { __typename?: 'Note', id: string, latestRevision?: { __typename?: 'NoteRevision', summary?: string | null, textForSearch: string } | null } | null };

export type RecentNotesQueryVariables = Exact<{ [key: string]: never; }>;


export type RecentNotesQuery = { __typename?: 'Query', recentNotes: Array<{ __typename?: 'Note', id: string, scope?: { __typename?: 'Scope', permissions?: { __typename?: 'ScopePermission', canAddTheirNotesToChild: boolean } | null } | null, latestRevision?: { __typename?: 'NoteRevision', id: string, summary?: string | null, writtenAt: any, contentType: string, content: any, attributes: any } | null, parents: Array<{ __typename?: 'NoteRelation', parent?: { __typename?: 'Note', id: string, latestRevision?: { __typename?: 'NoteRevision', summary?: string | null, textForSearch: string } | null } | null }> }> };

export type GetNoteQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetNoteQuery = { __typename?: 'Query', note?: { __typename?: 'Note', id: string, latestRevision?: { __typename?: 'NoteRevision', id: string, summary?: string | null, writtenAt: any, contentType: string, content: any, attributes: any } | null, scope?: { __typename?: 'Scope', permissions?: { __typename?: 'ScopePermission', canAddTheirNotesToChild: boolean } | null } | null, parents: Array<{ __typename?: 'NoteRelation', parent?: { __typename?: 'Note', id: string, latestRevision?: { __typename?: 'NoteRevision', summary?: string | null, textForSearch: string } | null, scope?: { __typename?: 'Scope', permissions?: { __typename?: 'ScopePermission', canAddTheirNotesToChild: boolean } | null } | null } | null }>, childs: Array<{ __typename?: 'NoteRelation', child?: { __typename?: 'Note', id: string, latestRevision?: { __typename?: 'NoteRevision', id: string, summary?: string | null, writtenAt: any, contentType: string, content: any, attributes: any } | null, scope?: { __typename?: 'Scope', permissions?: { __typename?: 'ScopePermission', canAddTheirNotesToChild: boolean } | null } | null, childs: Array<{ __typename?: 'NoteRelation', child?: { __typename?: 'Note', id: string } | null }> } | null }> } | null };

export type GetNoteChildsQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetNoteChildsQuery = { __typename?: 'Query', note?: { __typename?: 'Note', childs: Array<{ __typename?: 'NoteRelation', child?: { __typename?: 'Note', id: string, latestRevision?: { __typename?: 'NoteRevision', id: string, summary?: string | null, writtenAt: any, contentType: string, content: any, attributes: any } | null, scope?: { __typename?: 'Scope', permissions?: { __typename?: 'ScopePermission', canAddTheirNotesToChild: boolean } | null } | null, childs: Array<{ __typename?: 'NoteRelation', child?: { __typename?: 'Note', id: string } | null }> } | null }> } | null };


export const MyDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"My"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"viewer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<MyQuery, MyQueryVariables>;
export const MyScopesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MyScopes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"viewer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"scopes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"permissions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"canModifyNotes"}}]}}]}}]}}]}}]} as unknown as DocumentNode<MyScopesQuery, MyScopesQueryVariables>;
export const CreateNewNoteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateNewNote"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateNewNoteInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createNewNote"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<CreateNewNoteMutation, CreateNewNoteMutationVariables>;
export const SimpleNoteLinkFromIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"SimpleNoteLinkFromId"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"note"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"latestRevision"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"summary"}},{"kind":"Field","name":{"kind":"Name","value":"textForSearch"}}]}}]}}]}}]} as unknown as DocumentNode<SimpleNoteLinkFromIdQuery, SimpleNoteLinkFromIdQueryVariables>;
export const RecentNotesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"RecentNotes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"recentNotes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"scope"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"permissions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"canAddTheirNotesToChild"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"latestRevision"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"summary"}},{"kind":"Field","name":{"kind":"Name","value":"writtenAt"}},{"kind":"Field","name":{"kind":"Name","value":"contentType"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"attributes"}}]}},{"kind":"Field","name":{"kind":"Name","value":"parents"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"parent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"latestRevision"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"summary"}},{"kind":"Field","name":{"kind":"Name","value":"textForSearch"}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<RecentNotesQuery, RecentNotesQueryVariables>;
export const GetNoteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetNote"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"note"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"latestRevision"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"summary"}},{"kind":"Field","name":{"kind":"Name","value":"writtenAt"}},{"kind":"Field","name":{"kind":"Name","value":"contentType"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"attributes"}}]}},{"kind":"Field","name":{"kind":"Name","value":"scope"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"permissions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"canAddTheirNotesToChild"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"parents"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"parent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"latestRevision"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"summary"}},{"kind":"Field","name":{"kind":"Name","value":"textForSearch"}}]}},{"kind":"Field","name":{"kind":"Name","value":"scope"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"permissions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"canAddTheirNotesToChild"}}]}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"childs"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"child"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"latestRevision"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"summary"}},{"kind":"Field","name":{"kind":"Name","value":"writtenAt"}},{"kind":"Field","name":{"kind":"Name","value":"contentType"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"attributes"}}]}},{"kind":"Field","name":{"kind":"Name","value":"scope"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"permissions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"canAddTheirNotesToChild"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"childs"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"child"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetNoteQuery, GetNoteQueryVariables>;
export const GetNoteChildsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetNoteChilds"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"note"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"childs"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"child"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"latestRevision"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"summary"}},{"kind":"Field","name":{"kind":"Name","value":"writtenAt"}},{"kind":"Field","name":{"kind":"Name","value":"contentType"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"attributes"}}]}},{"kind":"Field","name":{"kind":"Name","value":"scope"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"permissions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"canAddTheirNotesToChild"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"childs"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"child"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetNoteChildsQuery, GetNoteChildsQueryVariables>;