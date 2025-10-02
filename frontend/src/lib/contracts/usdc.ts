import { ethers, BrowserProvider, Contract } from 'ethers'
import MockUSDCABI from '@/contracts/MockUSDC.json'
import { getContractAddress } from './addresses'

/**
 * Service for interacting with the MockUSDC (ERC-20) contract
 */
export class MockUSDCService {
  private static instance: MockUSDCService | null = null
  private contract: Contract | null = null
  private provider: BrowserProvider | null = null
  private signer: ethers.Signer | null = null

  private constructor() {}

  static getInstance(): MockUSDCService {
    if (!MockUSDCService.instance) {
      MockUSDCService.instance = new MockUSDCService()
    }
    return MockUSDCService.instance
  }

  /**
   * Initialize the service with MetaMask provider
   */
  async initialize() {
    if (typeof window.ethereum === 'undefined') {
      throw new Error('MetaMask not installed')
    }

    this.provider = new BrowserProvider(window.ethereum)
    this.signer = await this.provider.getSigner()
    
    const usdcAddress = getContractAddress('MockUSDC')
    this.contract = new Contract(usdcAddress, MockUSDCABI.abi, this.signer)
  }

  /**
   * Get the contract instance (initialize first if needed)
   */
  private async getContract(): Promise<Contract> {
    if (!this.contract) {
      await this.initialize()
    }
    return this.contract!
  }

  /**
   * Get USDC balance of an address
   * @param address The address to check
   * @returns Balance in USDC (6 decimals)
   */
  async balanceOf(address: string): Promise<string> {
    const contract = await this.getContract()
    const balance = await contract.balanceOf(address)
    return ethers.formatUnits(balance, 6)
  }

  /**
   * Get raw balance (in smallest unit)
   * @param address The address to check
   * @returns Balance as bigint
   */
  async balanceOfRaw(address: string): Promise<bigint> {
    const contract = await this.getContract()
    return await contract.balanceOf(address)
  }

  /**
   * Get allowance for a spender
   * @param owner Token owner address
   * @param spender Spender address (usually PoolFactory)
   * @returns Allowance in USDC (6 decimals)
   */
  async allowance(owner: string, spender: string): Promise<string> {
    const contract = await this.getContract()
    const allowance = await contract.allowance(owner, spender)
    return ethers.formatUnits(allowance, 6)
  }

  /**
   * Get raw allowance (in smallest unit)
   * @param owner Token owner address
   * @param spender Spender address
   * @returns Allowance as bigint
   */
  async allowanceRaw(owner: string, spender: string): Promise<bigint> {
    const contract = await this.getContract()
    return await contract.allowance(owner, spender)
  }

  /**
   * Approve a spender to use tokens
   * @param spender Address to approve (usually PoolFactory)
   * @param amount Amount to approve in USDC (will be converted to smallest unit)
   * @returns Transaction response
   */
  async approve(spender: string, amount: string) {
    const contract = await this.getContract()
    const amountInSmallestUnit = ethers.parseUnits(amount, 6)
    
    const tx = await contract.approve(spender, amountInSmallestUnit)
    return tx
  }

  /**
   * Approve a spender with raw amount (already in smallest unit)
   * @param spender Address to approve
   * @param amountRaw Amount in smallest unit (1 USDC = 1000000)
   * @returns Transaction response
   */
  async approveRaw(spender: string, amountRaw: bigint) {
    const contract = await this.getContract()
    const tx = await contract.approve(spender, amountRaw)
    return tx
  }

  /**
   * Check if user has approved enough tokens
   * @param owner Token owner
   * @param spender Spender address
   * @param requiredAmount Required amount in smallest unit
   * @returns true if allowance >= required
   */
  async hasEnoughAllowance(
    owner: string, 
    spender: string, 
    requiredAmount: bigint
  ): Promise<boolean> {
    const allowance = await this.allowanceRaw(owner, spender)
    return allowance >= requiredAmount
  }

  /**
   * Get token decimals (always 6 for USDC)
   */
  async decimals(): Promise<number> {
    const contract = await this.getContract()
    return await contract.decimals()
  }

  /**
   * Get token symbol
   */
  async symbol(): Promise<string> {
    const contract = await this.getContract()
    return await contract.symbol()
  }

  /**
   * Get token name
   */
  async name(): Promise<string> {
    const contract = await this.getContract()
    return await contract.name()
  }

  /**
   * Mint tokens (only available in mock contract)
   * @param to Address to mint to
   * @param amount Amount in USDC
   */
  async mint(to: string, amount: string) {
    const contract = await this.getContract()
    const amountInSmallestUnit = ethers.parseUnits(amount, 6)
    const tx = await contract.mint(to, amountInSmallestUnit)
    return tx
  }

  /**
   * Estimate gas for approve transaction
   * @param spender Spender address
   * @param amount Amount in USDC
   */
  async estimateApproveGas(spender: string, amount: string): Promise<bigint> {
    const contract = await this.getContract()
    const amountInSmallestUnit = ethers.parseUnits(amount, 6)
    return await contract.approve.estimateGas(spender, amountInSmallestUnit)
  }

  /**
   * Format USDC amount for display
   * @param amountRaw Amount in smallest unit
   * @returns Formatted string (e.g., "100.50 USDC")
   */
  formatAmount(amountRaw: bigint): string {
    const formatted = ethers.formatUnits(amountRaw, 6)
    return `${parseFloat(formatted).toLocaleString()} USDC`
  }

  /**
   * Parse USDC amount from string to smallest unit
   * @param amount Amount as string (e.g., "100.50")
   * @returns Amount in smallest unit as bigint
   */
  parseAmount(amount: string): bigint {
    return ethers.parseUnits(amount, 6)
  }
}

/**
 * Get singleton instance of MockUSDCService
 */
export async function getMockUSDCService(): Promise<MockUSDCService> {
  const service = MockUSDCService.getInstance()
  await service.initialize()
  return service
}
