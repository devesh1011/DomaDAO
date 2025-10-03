import { ApolloClient, InMemoryCache, HttpLink, gql } from '@apollo/client/core';
import fetch from 'cross-fetch';
import axios from 'axios';
import { subgraphLogger as logger } from '../../utils/logger.js';
import { config } from '../../config/index.js';
import {
  NameModel,
  TokenModel,
  PaginatedResponse,
  NamesQueryParams,
  TokensQueryParams,
  ActivitiesQueryParams,
  OffersQueryParams,
  ListingsQueryParams,
  NameActivity,
  TokenActivity,
  OfferModel,
  ListingModel,
} from '../../types/doma.js';

export class SubgraphClient {
  private client: ApolloClient<any>;

  constructor() {
    this.client = new ApolloClient({
      link: new HttpLink({
        uri: config.domaApi.subgraphURL,
        fetch,
        headers: {
          'Api-Key': config.domaApi.apiKey,
          'Content-Type': 'application/json',
        },
      }),
      cache: new InMemoryCache(),
      defaultOptions: {
        query: {
          fetchPolicy: 'network-only',
          errorPolicy: 'all',
        },
      },
    });
  }

  /**
   * Get paginated list of tokenized names
   */
  async getNames(params: NamesQueryParams = {}): Promise<PaginatedResponse<NameModel>> {
    const query = gql`
      query GetNames(
        $skip: Int
        $take: Int
        $ownedBy: [AddressCAIP10!]
        $claimStatus: NamesQueryClaimStatus
        $name: String
        $networkIds: [String!]
        $registrarIanaIds: [Int!]
        $tlds: [String!]
        $sortOrder: SortOrderType
      ) {
        names(
          skip: $skip
          take: $take
          ownedBy: $ownedBy
          claimStatus: $claimStatus
          name: $name
          networkIds: $networkIds
          registrarIanaIds: $registrarIanaIds
          tlds: $tlds
          sortOrder: $sortOrder
        ) {
          items {
            name
            expiresAt
            tokenizedAt
            eoi
            claimedBy
            transferLock
            registrar {
              name
              ianaId
              websiteUrl
            }
            tokens {
              tokenId
              networkId
              ownerAddress
              type
              expiresAt
            }
          }
          totalCount
          pageSize
          currentPage
          totalPages
          hasPreviousPage
          hasNextPage
        }
      }
    `;

    try {
      const result = await this.client.query({
        query,
        variables: params,
      });

      return result.data.names;
    } catch (error) {
      logger.error({ error, params }, 'Error fetching names');
      throw error;
    }
  }

  /**
   * Get information about a specific tokenized name
   */
  async getName(name: string): Promise<NameModel | null> {
    const query = gql`
      query GetName($name: String!) {
        name(name: $name) {
          name
          expiresAt
          tokenizedAt
          eoi
          claimedBy
          transferLock
          registrar {
            name
            ianaId
            publicKeys
            websiteUrl
            supportEmail
          }
          nameservers {
            ldhName
          }
          dsKeys {
            keyTag
            algorithm
            digest
            digestType
          }
          tokens {
            tokenId
            networkId
            ownerAddress
            type
            startsAt
            expiresAt
            tokenAddress
            explorerUrl
            createdAt
            chain {
              name
              networkId
            }
          }
        }
      }
    `;

    try {
      const result = await this.client.query({
        query,
        variables: { name },
      });

      return result.data.name;
    } catch (error: any) {
      // Check if it's a GraphQL "NOT_FOUND" error
      if (error.graphQLErrors && error.graphQLErrors.length > 0) {
        const notFoundError = error.graphQLErrors.find(
          (err: any) => err.extensions?.code === 'NOT_FOUND'
        );
        if (notFoundError) {
          logger.info({ name }, 'Name not found in subgraph');
          return null;
        }
      }
      
      logger.error({ error, name }, 'Error fetching name');
      throw error;
    }
  }

  /**
   * Get paginated list of tokens
   */
  async getTokens(params: TokensQueryParams): Promise<PaginatedResponse<TokenModel>> {
    const query = gql`
      query GetTokens($name: String!, $skip: Int, $take: Int) {
        tokens(name: $name, skip: $skip, take: $take) {
          items {
            tokenId
            networkId
            ownerAddress
            type
            startsAt
            expiresAt
            tokenAddress
            explorerUrl
            createdAt
            chain {
              name
              networkId
            }
            listings {
              id
              price
              expiresAt
              currency {
                symbol
                decimals
              }
            }
          }
          totalCount
          pageSize
          currentPage
          totalPages
          hasPreviousPage
          hasNextPage
        }
      }
    `;

    try {
      const result = await this.client.query({
        query,
        variables: params,
      });

      return result.data.tokens;
    } catch (error) {
      logger.error({ error, params }, 'Error fetching tokens');
      throw error;
    }
  }

  /**
   * Get information about a specific token
   */
  async getToken(tokenId: string): Promise<TokenModel> {
    const query = gql`
      query GetToken($tokenId: String!) {
        token(tokenId: $tokenId) {
          tokenId
          networkId
          ownerAddress
          type
          startsAt
          expiresAt
          tokenAddress
          explorerUrl
          createdAt
          chain {
            name
            networkId
          }
          listings {
            id
            externalId
            price
            offererAddress
            orderbook
            expiresAt
            createdAt
            currency {
              name
              symbol
              decimals
            }
          }
        }
      }
    `;

    try {
      const result = await this.client.query({
        query,
        variables: { tokenId },
      });

      return result.data.token;
    } catch (error) {
      logger.error({ error, tokenId }, 'Error fetching token');
      throw error;
    }
  }

  /**
   * Get activities for a specific name
   */
  /**
   * Get activities for a specific name
   */
  async getNameActivities(
    name: string,
    params: ActivitiesQueryParams = {}
  ): Promise<PaginatedResponse<NameActivity>> {
    try {
      const query = `
        query GetNameActivities($name: String!, $skip: Int, $take: Int, $type: NameActivityType, $sortOrder: SortOrderType) {
          nameActivities(name: $name, skip: $skip, take: $take, type: $type, sortOrder: $sortOrder) {
            items {
              ... on NameClaimedActivity {
                type
                txHash
                sld
                tld
                createdAt
                claimedBy
              }
              ... on NameRenewedActivity {
                type
                txHash
                sld
                tld
                createdAt
                expiresAt
              }
              ... on NameTokenizedActivity {
                type
                txHash
                sld
                tld
                createdAt
                networkId
              }
              ... on NameDetokenizedActivity {
                type
                txHash
                sld
                tld
                createdAt
                networkId
              }
            }
            totalCount
            pageSize
            currentPage
            totalPages
            hasPreviousPage
            hasNextPage
          }
        }
      `;

      const response = await axios.post(
        config.domaApi.subgraphURL,
        {
          query,
          variables: { name, ...params },
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Api-Key': config.domaApi.apiKey,
          },
        }
      );

      if (response.data.errors) {
        throw new Error(JSON.stringify(response.data.errors));
      }

      return response.data.data.nameActivities;
    } catch (error) {
      const err = error as any;
      logger.error({
        error: err?.message || err,
        responseData: err?.response?.data,
        responseStatus: err?.response?.status,
        name,
        params,
      }, 'Error fetching name activities');
      throw error;
    }
  }

  /**
   * Get activities for a specific token
   */
  async getTokenActivities(
    tokenId: string,
    params: ActivitiesQueryParams = {}
  ): Promise<PaginatedResponse<TokenActivity>> {
    const query = gql`
      query GetTokenActivities(
        $tokenId: String!
        $skip: Float
        $take: Float
        $type: TokenActivityType
        $sortOrder: SortOrderType
      ) {
        tokenActivities(
          tokenId: $tokenId
          skip: $skip
          take: $take
          type: $type
          sortOrder: $sortOrder
        ) {
          items {
            ... on TokenMintedActivity {
              type
              networkId
              txHash
              finalized
              tokenId
              createdAt
            }
            ... on TokenTransferredActivity {
              type
              networkId
              txHash
              finalized
              tokenId
              createdAt
              transferredTo
              transferredFrom
            }
            ... on TokenListedActivity {
              type
              networkId
              txHash
              finalized
              tokenId
              createdAt
              orderId
              expiresAt
              seller
              payment {
                price
                currencySymbol
              }
              orderbook
            }
          }
          totalCount
          pageSize
          currentPage
          totalPages
          hasPreviousPage
          hasNextPage
        }
      }
    `;

    try {
      const result = await this.client.query({
        query,
        variables: { tokenId, ...params },
      });

      return result.data.tokenActivities;
    } catch (error) {
      logger.error({ error, tokenId, params }, 'Error fetching token activities');
      throw error;
    }
  }

  /**
   * Get offers for tokenized names
   */
  async getOffers(
    params: OffersQueryParams = {}
  ): Promise<PaginatedResponse<OfferModel>> {
    try {
      const query = `
        query GetOffers($tokenId: String, $offeredBy: [AddressCAIP10!], $skip: Int, $take: Int, $status: OfferStatus, $sortOrder: SortOrderType) {
          offers(tokenId: $tokenId, offeredBy: $offeredBy, skip: $skip, take: $take, status: $status, sortOrder: $sortOrder) {
            items {
              id
              externalId
              price
              offererAddress
              orderbook
              expiresAt
              createdAt
              currency {
                name
                symbol
                decimals
              }
            }
            totalCount
            pageSize
            currentPage
            totalPages
            hasPreviousPage
            hasNextPage
          }
        }
      `;

      const response = await axios.post(
        config.domaApi.subgraphURL,
        {
          query,
          variables: params,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Api-Key': config.domaApi.apiKey,
          },
        }
      );

      if (response.data.errors) {
        throw new Error(JSON.stringify(response.data.errors));
      }

      return response.data.data.offers;
    } catch (error) {
      const err = error as any;
      logger.error({
        error: err?.message || err,
        params,
      }, 'Error fetching offers');
      throw error;
    }
  }

  /**
   * Get listings for tokenized names
   */
  async getListings(
    params: ListingsQueryParams = {}
  ): Promise<PaginatedResponse<ListingModel>> {
    try {
      const query = `
        query GetListings($skip: Int, $take: Int, $tlds: [String!], $createdSince: DateTime, $sld: String, $networkIds: [String!], $registrarIanaIds: [Int!]) {
          listings(skip: $skip, take: $take, tlds: $tlds, createdSince: $createdSince, sld: $sld, networkIds: $networkIds, registrarIanaIds: $registrarIanaIds) {
            items {
              id
              externalId
              price
              offererAddress
              orderbook
              expiresAt
              createdAt
              updatedAt
              currency {
                name
                symbol
                decimals
              }
            }
            totalCount
            pageSize
            currentPage
            totalPages
            hasPreviousPage
            hasNextPage
          }
        }
      `;

      const response = await axios.post(
        config.domaApi.subgraphURL,
        {
          query,
          variables: params,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Api-Key': config.domaApi.apiKey,
          },
        }
      );

      if (response.data.errors) {
        throw new Error(JSON.stringify(response.data.errors));
      }

      return response.data.data.listings;
    } catch (error) {
      const err = error as any;
      logger.error({
        error: err?.message || err,
        params,
      }, 'Error fetching listings');
      throw error;
    }
  }
}

export const subgraphClient = new SubgraphClient();
