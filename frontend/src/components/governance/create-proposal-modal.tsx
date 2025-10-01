"use client"

import { useState } from "react"
import { Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface CreateProposalModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateProposalModal({ open, onOpenChange }: CreateProposalModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    poolAddress: '',
    proposalType: 'general'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))

    setIsSubmitting(false)
    onOpenChange(false)

    // Reset form
    setFormData({
      title: '',
      description: '',
      poolAddress: '',
      proposalType: 'general'
    })

    alert('Proposal created successfully!')
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Create New Proposal
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Proposal Type */}
            <div className="space-y-2">
              <Label htmlFor="proposalType">Proposal Type</Label>
              <Select
                value={formData.proposalType}
                onValueChange={(value) => handleInputChange('proposalType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select proposal type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General Proposal</SelectItem>
                  <SelectItem value="funding">Funding Request</SelectItem>
                  <SelectItem value="parameter">Parameter Change</SelectItem>
                  <SelectItem value="contract">Contract Upgrade</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Pool Selection */}
            <div className="space-y-2">
              <Label htmlFor="poolAddress">Pool Address</Label>
              <Select
                value={formData.poolAddress}
                onValueChange={(value) => handleInputChange('poolAddress', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a pool" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0x1234...abcd">premium.ai Pool</SelectItem>
                  <SelectItem value="0x5678...efgh">revenue-pool</SelectItem>
                  <SelectItem value="0x9abc...ijkl">dex-liquidity Pool</SelectItem>
                  <SelectItem value="0xdef0...mnop">governance Pool</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Proposal Title</Label>
              <Input
                id="title"
                placeholder="Enter a clear, descriptive title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Proposal Description</Label>
              <textarea
                id="description"
                placeholder="Describe your proposal in detail. Include the problem, solution, and expected impact."
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={6}
                className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                required
              />
              <p className="text-xs text-muted-foreground">
                Be specific and provide enough context for voters to make an informed decision.
              </p>
            </div>

            {/* Requirements Info */}
            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Proposal Requirements</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• You must hold shares in the selected pool</li>
                <li>• Minimum voting power: 100 shares</li>
                <li>• Proposal deposit: 1 ETH (refundable if passed)</li>
                <li>• Voting period: 7 days</li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Proposal'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}