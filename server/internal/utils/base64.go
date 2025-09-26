package utils

import (
	"encoding/base64"
	"strings"
)

// ValidateAndCleanBase64 validates base64 data and cleans common issues
func ValidateAndCleanBase64(data string) (string, error) {
	// Remove common whitespace characters
	cleaned := strings.TrimSpace(data)
	cleaned = strings.ReplaceAll(cleaned, "\n", "")
	cleaned = strings.ReplaceAll(cleaned, "\r", "")
	cleaned = strings.ReplaceAll(cleaned, "\t", "")
	cleaned = strings.ReplaceAll(cleaned, " ", "")
	
	// Try standard base64 decoding first
	if _, err := base64.StdEncoding.DecodeString(cleaned); err == nil {
		return cleaned, nil
	}
	
	// If that fails, try adding padding if needed
	switch len(cleaned) % 4 {
	case 2:
		cleaned += "=="
	case 3:
		cleaned += "="
	}
	
	// Try again with padding
	if _, err := base64.StdEncoding.DecodeString(cleaned); err == nil {
		return cleaned, nil
	}
	
	// Try URL-safe base64 decoding as fallback
	urlSafeCleaned := cleaned
	if _, err := base64.URLEncoding.DecodeString(urlSafeCleaned); err == nil {
		// Convert URL-safe to standard base64
		cleaned = strings.ReplaceAll(cleaned, "-", "+")
		cleaned = strings.ReplaceAll(cleaned, "_", "/")
		// Re-add padding if needed
		switch len(cleaned) % 4 {
		case 2:
			cleaned += "=="
		case 3:
			cleaned += "="
		}
		return cleaned, nil
	}
	
	// If all methods fail, return original error
	_, err := base64.StdEncoding.DecodeString(data)
	return "", err
}