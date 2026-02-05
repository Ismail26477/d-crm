'use client'

import React from "react"

import { useState, useEffect } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Phone, Delete, X } from 'lucide-react'

interface DialPadModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialNumber?: string
}

export function DialPadModal({ open, onOpenChange, initialNumber = '' }: DialPadModalProps) {
  const [displayNumber, setDisplayNumber] = useState(initialNumber)
  const [dialedNumber, setDialedNumber] = useState(initialNumber)
  const [isDialing, setIsDialing] = useState(false)

  useEffect(() => {
    if (open && initialNumber) {
      setDisplayNumber(initialNumber)
      setDialedNumber(initialNumber)
    }
  }, [open, initialNumber])

  const handleKeyPress = (key: string) => {
    const newNumber = displayNumber + key
    setDisplayNumber(newNumber)
    setDialedNumber(newNumber)
  }

  const handleBackspace = () => {
    const newNumber = displayNumber.slice(0, -1)
    setDisplayNumber(newNumber)
    setDialedNumber(newNumber)
  }

  const handleClear = () => {
    setDisplayNumber('')
    setDialedNumber('')
  }

  const handleDial = () => {
    if (dialedNumber.trim()) {
      setIsDialing(true)
      const cleanNumber = dialedNumber.replace(/\D/g, (match, index) => index === 0 && dialedNumber[0] === '+' ? '+' : match)
      console.log('[v0] Initiating call to:', cleanNumber)
      window.open(`tel:${cleanNumber}`, '_blank')
      
      setTimeout(() => {
        setIsDialing(false)
        onOpenChange(false)
        handleClear()
      }, 500)
    }
  }

  const handleKeyboardInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key >= '0' && e.key <= '9') {
      handleKeyPress(e.key)
    } else if (e.key === '*' || e.key === '#') {
      handleKeyPress(e.key)
    } else if (e.key === 'Backspace') {
      e.preventDefault()
      handleBackspace()
    } else if (e.key === 'Delete') {
      e.preventDefault()
      handleClear()
    } else if (e.key === 'Enter') {
      e.preventDefault()
      handleDial()
    }
  }

  const dialPadNumbers = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['*', '0', '#'],
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-sm p-0 gap-0 rounded-xl overflow-hidden shadow-xl border-0">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-4">
          <h2 className="text-white text-center text-sm font-semibold uppercase tracking-wide">Quick Dial</h2>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Display */}
          <div>
            <Input
              type="text"
              value={displayNumber}
              onKeyDown={handleKeyboardInput}
              autoFocus
              readOnly={false}
              className="text-center text-2xl font-bold tracking-wider bg-gradient-to-b from-slate-50 to-slate-100 border border-slate-200 rounded-lg h-14 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400/30 placeholder-slate-300"
              placeholder="0"
            />
          </div>

          {/* Dial Pad Grid */}
          <div className="space-y-2.5">
            {dialPadNumbers.map((row, rowIndex) => (
              <div key={rowIndex} className="grid grid-cols-3 gap-2">
                {row.map((number) => (
                  <Button
                    key={number}
                    onClick={() => handleKeyPress(number)}
                    className="h-12 text-lg font-semibold bg-white hover:bg-blue-50 text-slate-800 border border-slate-200 hover:border-blue-300 rounded-lg transition-all duration-150 active:bg-blue-100 active:scale-95 shadow-sm hover:shadow-md"
                    variant="outline"
                  >
                    {number}
                  </Button>
                ))}
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-2 pt-2">
            <Button
              onClick={handleBackspace}
              variant="outline"
              className="h-10 border-red-200 hover:bg-red-50 text-red-600 bg-white rounded-lg transition-all duration-150 active:scale-95 shadow-sm"
              disabled={!displayNumber}
              title="Delete last digit"
            >
              <Delete className="w-4 h-4" />
            </Button>

            <Button
              onClick={handleClear}
              variant="outline"
              className="h-10 border-orange-200 hover:bg-orange-50 text-orange-600 bg-white rounded-lg transition-all duration-150 active:scale-95 shadow-sm"
              disabled={!displayNumber}
              title="Clear all"
            >
              <X className="w-4 h-4" />
            </Button>

            <Button
              onClick={handleDial}
              className="h-10 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg font-semibold transition-all duration-150 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
              disabled={!displayNumber || isDialing}
              title="Dial the number"
            >
              {isDialing ? (
                <span className="text-xs animate-pulse">Calling...</span>
              ) : (
                <Phone className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* Close Button */}
          <Button
            onClick={() => onOpenChange(false)}
            variant="ghost"
            className="w-full h-10 text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition-all duration-150 rounded-lg"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
