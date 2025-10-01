import axios, { AxiosInstance } from 'axios';
import { orderbookLogger as logger } from '../../utils/logger.js';
import { config } from '../../config/index.js';
import {
  CreateListingRequest,
  CreateOfferRequest,
  OrderResponse,
  FulfillmentData,
  CancelOrderRequest,
  MarketplaceFeesResponse,
  CurrenciesResponse,
  OrderbookType,
} from '../../types/doma.js';

export class OrderbookClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: config.domaApi.baseURL,
      headers: {
        'Api-Key': config.domaApi.apiKey,
        'Content-Type': 'application/json',
      },
      timeout: config.api.timeoutMs,
    });
  }

  /**
   * Create a fixed-price listing on the orderbook
   */
  async createListing(request: CreateListingRequest): Promise<OrderResponse> {
    try {
      logger.info({
        orderbook: request.orderbook,
        chainId: request.chainId,
      }, 'Creating listing');

      const response = await this.client.post<OrderResponse>(
        '/v1/orderbook/list',
        request
      );

      logger.info({
        orderId: response.data.orderId,
      }, 'Listing created successfully');

      return response.data;
    } catch (error) {
      logger.error({ error }, 'Error creating listing');
      throw error;
    }
  }

  /**
   * Create an offer on the orderbook
   */
  async createOffer(request: CreateOfferRequest): Promise<OrderResponse> {
    try {
      logger.info({
        orderbook: request.orderbook,
        chainId: request.chainId,
      }, 'Creating offer');

      const response = await this.client.post<OrderResponse>(
        '/v1/orderbook/offer',
        request
      );

      logger.info({
        orderId: response.data.orderId,
      }, 'Offer created successfully');

      return response.data;
    } catch (error) {
      logger.error({ error }, 'Error creating offer');
      throw error;
    }
  }

  /**
   * Get listing fulfillment data for a buyer
   */
  async getListingFulfillmentData(
    orderId: string,
    buyer: string
  ): Promise<FulfillmentData> {
    try {
      logger.debug({ orderId, buyer }, 'Getting listing fulfillment data');

      const response = await this.client.get<FulfillmentData>(
        `/v1/orderbook/listing/${orderId}/${buyer}`
      );

      return response.data;
    } catch (error) {
      logger.error({ error, orderId, buyer }, 'Error getting listing fulfillment data');
      throw error;
    }
  }

  /**
   * Get offer fulfillment data for a fulfiller (token owner)
   */
  async getOfferFulfillmentData(
    orderId: string,
    fulfiller: string
  ): Promise<FulfillmentData> {
    try {
      logger.debug({ orderId, fulfiller }, 'Getting offer fulfillment data');

      const response = await this.client.get<FulfillmentData>(
        `/v1/orderbook/offer/${orderId}/${fulfiller}`
      );

      return response.data;
    } catch (error) {
      logger.error({ error, orderId, fulfiller }, 'Error getting offer fulfillment data');
      throw error;
    }
  }

  /**
   * Cancel a listing
   */
  async cancelListing(request: CancelOrderRequest): Promise<OrderResponse> {
    try {
      logger.info({ orderId: request.orderId }, 'Cancelling listing');

      const response = await this.client.post<OrderResponse>(
        '/v1/orderbook/listing/cancel',
        request
      );

      logger.info({ orderId: request.orderId }, 'Listing cancelled successfully');

      return response.data;
    } catch (error) {
      logger.error({ error, orderId: request.orderId }, 'Error cancelling listing');
      throw error;
    }
  }

  /**
   * Cancel an offer
   */
  async cancelOffer(request: CancelOrderRequest): Promise<OrderResponse> {
    try {
      logger.info({ orderId: request.orderId }, 'Cancelling offer');

      const response = await this.client.post<OrderResponse>(
        '/v1/orderbook/offer/cancel',
        request
      );

      logger.info({ orderId: request.orderId }, 'Offer cancelled successfully');

      return response.data;
    } catch (error) {
      logger.error({ error, orderId: request.orderId }, 'Error cancelling offer');
      throw error;
    }
  }

  /**
   * Get marketplace fees for a specific orderbook and chain
   */
  async getMarketplaceFees(
    orderbook: OrderbookType,
    chainId: string,
    contractAddress: string
  ): Promise<MarketplaceFeesResponse> {
    try {
      logger.debug({
        orderbook,
        chainId,
        contractAddress,
      }, 'Getting marketplace fees');

      const response = await this.client.get<MarketplaceFeesResponse>(
        `/v1/orderbook/fee/${orderbook}/${chainId}/${contractAddress}`
      );

      return response.data;
    } catch (error) {
      logger.error({
        error,
        orderbook,
        chainId,
        contractAddress,
      }, 'Error getting marketplace fees');
      throw error;
    }
  }

  /**
   * Get supported currencies for a specific chain and orderbook
   */
  async getSupportedCurrencies(
    chainId: string,
    contractAddress: string,
    orderbook: OrderbookType
  ): Promise<CurrenciesResponse> {
    try {
      logger.debug({
        chainId,
        contractAddress,
        orderbook,
      }, 'Getting supported currencies');

      const response = await this.client.get<CurrenciesResponse>(
        `/v1/orderbook/currencies/${chainId}/${contractAddress}/${orderbook}`
      );

      return response.data;
    } catch (error) {
      logger.error({
        error,
        chainId,
        contractAddress,
        orderbook,
      }, 'Error getting supported currencies');
      throw error;
    }
  }
}

export const orderbookClient = new OrderbookClient();
