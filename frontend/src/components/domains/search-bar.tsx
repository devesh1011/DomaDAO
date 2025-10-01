"use client"

import { useState, useEffect, useRef } from "react"
import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface SearchBarProps {
  onSearch: (query: string) => void
  placeholder?: string
}

interface DomainSuggestion {
  name: string
  tld: string
}

const mockSuggestions: DomainSuggestion[] = [
  { name: "crypto", tld: ".eth" },
  { name: "defi", tld: ".domains" },
  { name: "web3", tld: ".nft" },
  { name: "blockchain", tld: ".xyz" },
  { name: "dao", tld: ".org" }
]

export function SearchBar({ onSearch, placeholder = "Search domains..." }: SearchBarProps) {
  const [query, setQuery] = useState("")
  const [suggestions, setSuggestions] = useState<DomainSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length > 0) {
        onSearch(query)
        // Filter suggestions based on query
        const filtered = mockSuggestions.filter(suggestion =>
          suggestion.name.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 5)
        setSuggestions(filtered)
        setShowSuggestions(filtered.length > 0)
      } else {
        onSearch("")
        setShowSuggestions(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query, onSearch])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
    setSelectedIndex(-1)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) return

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setSelectedIndex(prev =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        )
        break
      case "ArrowUp":
        e.preventDefault()
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
        break
      case "Enter":
        e.preventDefault()
        if (selectedIndex >= 0) {
          handleSuggestionClick(suggestions[selectedIndex])
        } else {
          onSearch(query)
          setShowSuggestions(false)
        }
        break
      case "Escape":
        setShowSuggestions(false)
        setSelectedIndex(-1)
        inputRef.current?.blur()
        break
    }
  }

  const handleSuggestionClick = (suggestion: DomainSuggestion) => {
    setQuery(suggestion.name)
    onSearch(suggestion.name)
    setShowSuggestions(false)
    setSelectedIndex(-1)
  }

  const handleClear = () => {
    setQuery("")
    onSearch("")
    setShowSuggestions(false)
    setSelectedIndex(-1)
    inputRef.current?.focus()
  }

  const handleFocus = () => {
    if (query.length > 0 && suggestions.length > 0) {
      setShowSuggestions(true)
    }
  }

  const handleBlur = () => {
    // Delay hiding suggestions to allow for clicks
    setTimeout(() => setShowSuggestions(false), 150)
  }

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className="pl-10 pr-10 h-12 text-lg"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Auto-suggest dropdown */}
      {showSuggestions && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50 max-h-60 overflow-y-auto">
          <div className="p-2">
            {suggestions.map((suggestion, index) => (
              <button
                key={`${suggestion.name}${suggestion.tld}`}
                onClick={() => handleSuggestionClick(suggestion)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm hover:bg-muted transition-colors ${
                  index === selectedIndex ? "bg-muted" : ""
                }`}
              >
                <span className="font-medium">{suggestion.name}</span>
                <span className="text-muted-foreground">{suggestion.tld}</span>
              </button>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}