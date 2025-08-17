"use client"

import React, { useState } from "react"
import { Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface PasswordStrength {
  score: number
  feedback: string[]
  isValid: boolean
}

interface PasswordValidatorProps {
  password: string
  onValidationChange: (isValid: boolean) => void
}

const validatePassword = (password: string): PasswordStrength => {
  const feedback: string[] = []
  let score = 0

  // Length check
  if (password.length >= 8) {
    score += 1
  } else {
    feedback.push("At least 8 characters required")
  }

  // Uppercase check
  if (/[A-Z]/.test(password)) {
    score += 1
  } else {
    feedback.push("At least one uppercase letter required")
  }

  // Lowercase check
  if (/[a-z]/.test(password)) {
    score += 1
  } else {
    feedback.push("At least one lowercase letter required")
  }

  // Number check
  if (/\d/.test(password)) {
    score += 1
  } else {
    feedback.push("At least one number required")
  }

  // Special character check
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    score += 1
  } else {
    feedback.push("At least one special character required")
  }

  // Common patterns check
  const commonPatterns = [
    /(.)\1{2,}/, // Repeated characters
    /123456|654321|qwerty|password|admin/i, // Common sequences
  ]

  for (const pattern of commonPatterns) {
    if (pattern.test(password)) {
      feedback.push("Avoid common patterns and repeated characters")
      score = Math.max(0, score - 1)
      break
    }
  }

  return {
    score,
    feedback,
    isValid: score >= 4 && feedback.length === 0
  }
}

export function PasswordValidator({ password, onValidationChange }: PasswordValidatorProps) {
  const validation = validatePassword(password)
  
  // Notify parent component of validation status
  React.useEffect(() => {
    onValidationChange(validation.isValid)
  }, [validation.isValid, onValidationChange])

  const getStrengthColor = (score: number) => {
    if (score <= 2) return "bg-red-500"
    if (score <= 3) return "bg-yellow-500"
    if (score <= 4) return "bg-blue-500"
    return "bg-green-500"
  }

  const getStrengthText = (score: number) => {
    if (score <= 2) return "Weak"
    if (score <= 3) return "Fair"
    if (score <= 4) return "Good"
    return "Strong"
  }

  if (!password) return null

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <div className="flex-1 bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${getStrengthColor(validation.score)}`}
            style={{ width: `${(validation.score / 5) * 100}%` }}
          />
        </div>
        <span className="text-sm font-medium">{getStrengthText(validation.score)}</span>
      </div>
      
      {validation.feedback.length > 0 && (
        <div className="space-y-1">
          {validation.feedback.map((item, index) => (
            <div key={index} className="flex items-center space-x-2 text-sm text-red-600">
              <AlertCircle className="h-3 w-3" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      )}
      
      {validation.isValid && (
        <div className="flex items-center space-x-2 text-sm text-green-600">
          <CheckCircle2 className="h-3 w-3" />
          <span>Password meets all requirements</span>
        </div>
      )}
    </div>
  )
}

interface PasswordInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  showStrength?: boolean
  onValidationChange?: (isValid: boolean) => void
}

export function PasswordInput({ 
  value, 
  onChange, 
  placeholder = "Enter password", 
  showStrength = false,
  onValidationChange 
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="space-y-2">
      <div className="relative">
        <Input
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="pr-10"
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4 text-gray-500" />
          ) : (
            <Eye className="h-4 w-4 text-gray-500" />
          )}
        </Button>
      </div>
      
      {showStrength && onValidationChange && (
        <PasswordValidator password={value} onValidationChange={onValidationChange} />
      )}
    </div>
  )
}