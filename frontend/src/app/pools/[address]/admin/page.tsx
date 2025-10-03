"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreateRevenueDistribution } from "@/components/admin/create-revenue-distribution";
import { RevenueClaimInterface } from "@/components/pools/revenue-claim-interface";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield } from "lucide-react";
import Link from "next/link";
import { useWallet } from "@/contexts/wallet-context";
import { getFractionPoolService } from "@/lib/contracts/fraction-pool";
import { getContractAddress } from "@/lib/contracts/addresses";

export default function PoolAdminPage() {
  const params = useParams();
  const poolAddress = params?.address as string;
  const { account } = useWallet();

  const [poolInfo, setPoolInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);

  const usdcAddress = getContractAddress("MockUSDC");

  /**
   * Load pool information
   */
  const loadPoolInfo = async () => {
    try {
      setLoading(true);
      const service = await getFractionPoolService(poolAddress);
      const info = await service.getPoolInfo();
      setPoolInfo(info);

      // Check if current user is owner
      if (account && info.creator) {
        setIsOwner(info.creator.toLowerCase() === account.toLowerCase());
      }
    } catch (error) {
      console.error("Error loading pool info:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (poolAddress && account) {
      loadPoolInfo();
    }
  }, [poolAddress, account]);

  if (!account) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Connect Wallet</CardTitle>
            <CardDescription>
              Please connect your wallet to access admin features
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-gray-500">Loading pool information...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <Shield className="h-5 w-5" />
              Access Denied
            </CardTitle>
            <CardDescription>
              Only the pool owner can access admin features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href={`/pools/${poolAddress}`}>
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Pool
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Pool Admin</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage revenue distributions and pool settings
          </p>
        </div>
        <Link href={`/pools/${poolAddress}`}>
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Pool
          </Button>
        </Link>
      </div>

      {/* Pool Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Pool Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Pool Address
              </p>
              <p className="text-sm font-mono">
                {poolAddress.slice(0, 6)}...{poolAddress.slice(-4)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">State</p>
              <p className="text-sm font-medium">
                {poolInfo?.state || "Unknown"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Total Raised
              </p>
              <p className="text-sm font-medium">
                ${(Number(poolInfo?.totalRaised || 0) / 1e6).toFixed(2)} USDC
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Fraction Token
              </p>
              <p className="text-sm font-mono">
                {poolInfo?.fractionToken
                  ? `${poolInfo.fractionToken.slice(
                      0,
                      6
                    )}...${poolInfo.fractionToken.slice(-4)}`
                  : "Not yet created"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Admin Tabs */}
      <Tabs defaultValue="create" className="space-y-4">
        <TabsList>
          <TabsTrigger value="create">Create Distribution</TabsTrigger>
          <TabsTrigger value="history">Distribution History</TabsTrigger>
        </TabsList>

        <TabsContent value="create">
          {poolInfo?.fractionToken &&
          poolInfo.fractionToken !==
            "0x0000000000000000000000000000000000000000" ? (
            <CreateRevenueDistribution
              fractionTokenAddress={poolInfo.fractionToken}
              usdcAddress={usdcAddress}
              onSuccess={loadPoolInfo}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Fraction Token Required</CardTitle>
                <CardDescription>
                  The pool must be fractionalized before you can create revenue
                  distributions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Please complete the fractionalization process first by
                  purchasing a domain and fractionalizing it.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history">
          {poolInfo?.fractionToken &&
          poolInfo.fractionToken !==
            "0x0000000000000000000000000000000000000000" ? (
            <RevenueClaimInterface
              poolAddress={poolAddress}
              fractionTokenAddress={poolInfo.fractionToken}
              userAddress={account}
              onClaimSuccess={loadPoolInfo}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No Distribution History</CardTitle>
                <CardDescription>
                  Distributions will appear here once the pool is fractionalized
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
