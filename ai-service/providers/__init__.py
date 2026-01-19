"""
AI Providers Package

Provider factory for easy switching between AI providers.
To add a new provider:
1. Create a new file implementing AIProviderBase
2. Add it to the PROVIDERS dict below
3. Set AI_PROVIDER environment variable
"""

from .base import AIProviderBase
from .google_ai_studio import GoogleAIStudioProvider

# Provider registry - add new providers here
PROVIDERS = {
    "google_ai_studio": GoogleAIStudioProvider,
    # "openrouter": OpenRouterProvider,  # Future
}


def get_provider(provider_name: str = None) -> AIProviderBase:
    """
    Factory function to get the configured AI provider.
    
    Args:
        provider_name: Optional provider name override
        
    Returns:
        AIProviderBase instance
        
    Raises:
        ValueError: If provider is not found
    """
    from config import AI_PROVIDER
    
    name = provider_name or AI_PROVIDER
    
    if name not in PROVIDERS:
        available = ", ".join(PROVIDERS.keys())
        raise ValueError(f"Unknown provider '{name}'. Available: {available}")
    
    return PROVIDERS[name]()


__all__ = [
    "AIProviderBase",
    "GoogleAIStudioProvider",
    "get_provider",
    "PROVIDERS",
]
