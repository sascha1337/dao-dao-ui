import { gql, useQuery } from '@apollo/client'

// $id is {proposalModuleAddress}:{proposalNumber}
export const GET_PROPOSAL = gql`
  query GetProposal($id: String!) @api(name: proposals) {
    proposal(id: $id) {
      createdAt
      executedAt
      closedAt
      votes {
        nodes {
          votedAt
          walletId
        }
      }
    }
  }
`

export interface GetProposal {
  proposal: {
    createdAt: string // Serialized Date
    executedAt: string // Serialized Date
    closedAt: string // Serialized Date
    votes: {
      nodes: {
        votedAt: string // Serialized Date
        walletId: string
      }[]
    }
  } | null
}

export interface GetProposalOperationVariables {
  id: string
}

export const getGetProposalSubqueryId = (
  proposalModuleAddress: string,
  proposalNumber: number
) => `${proposalModuleAddress}:${proposalNumber}`

export const useProposalQuery = (
  ...args: Parameters<typeof getGetProposalSubqueryId>
) =>
  useQuery<GetProposal>(GET_PROPOSAL, {
    variables: {
      id: getGetProposalSubqueryId(...args),
    },
    // Refresh every 30 seconds.
    pollInterval: 30 * 1000,
  })