"""
AI Service - FastAPI Application

Main entry point for the AI Payment Parser Service.
Provides REST API endpoints for parsing payment screenshots.
"""

import logging
import os
from datetime import datetime
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

# Load environment variables from .env file
try:
    from dotenv import load_dotenv
    load_dotenv()
    logging.info("Loaded environment variables from .env file")
except ImportError:
    logging.warning("python-dotenv not installed, environment variables not loaded from .env")
except Exception as e:
    logging.warning(f"Failed to load .env file: {e}")

from models.schemas import (
    ParsePaymentRequest,
    ParsePaymentResponse,
    HealthResponse,
    StatusResponse,
)
from services.payment_parser import PaymentParserService
from config import (
    AI_SERVICE_ENABLED,
    LOG_LEVEL,
    get_service_status,
)

# Configure logging
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL.upper(), logging.INFO),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler."""
    # Startup
    logger.info("AI Service starting up...")
    logger.info(f"Service enabled: {AI_SERVICE_ENABLED}")
    status = get_service_status()
    logger.info(f"Provider: {status['provider']}")
    logger.info(f"Daily limit: {status['daily_limit']}")
    
    yield
    
    # Shutdown
    logger.info("AI Service shutting down...")


# Create FastAPI app
app = FastAPI(
    title="AI Payment Parser Service",
    description="Parse UPI payment screenshots using AI models",
    version="1.0.0",
    lifespan=lifespan,
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create service instance
payment_parser = PaymentParserService()


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Health check endpoint.
    
    Returns basic health status for k8s probes.
    """
    return HealthResponse(
        status="healthy" if AI_SERVICE_ENABLED else "unhealthy",
        service="ai-service",
        timestamp=datetime.utcnow().isoformat()
    )


@app.get("/version")
async def version_info():
    """
    Version information endpoint.
    
    Returns deployment version and build date for monitoring.
    """
    return {
        "service": "ai-service",
        "version": os.environ.get("APP_VERSION", "1.0.0"),
        "buildDate": os.environ.get("BUILD_DATE"),
        "pythonVersion": f"{os.sys.version_info.major}.{os.sys.version_info.minor}.{os.sys.version_info.micro}",
        "environment": os.environ.get("ENVIRONMENT", "development"),
    }


@app.get("/status", response_model=StatusResponse)
async def service_status():
    """
    Get detailed service status.
    
    Returns current configuration and usage statistics.
    """
    status = get_service_status()
    return StatusResponse(**status)


@app.get("/models")
async def list_available_models():
    """
    List available models from the AI provider.
    Useful for debugging model availability.
    """
    try:
        from providers import get_provider
        provider = get_provider()
        
        if provider.get_provider_name() == "google_ai_studio":
            import google.generativeai as genai
            models = []
            try:
                for model in genai.list_models():
                    if 'generateContent' in model.supported_generation_methods:
                        models.append({
                            "name": model.name,
                            "display_name": model.display_name,
                            "description": model.description,
                        })
            except Exception as e:
                return {
                    "success": False,
                    "error": str(e),
                    "provider": provider.get_provider_name(),
                    "current_model": provider.get_model_id(),
                }
            
            return {
                "success": True,
                "provider": provider.get_provider_name(),
                "current_model": provider.get_model_id(),
                "available_models": models,
            }
        else:
            return {
                "success": True,
                "provider": provider.get_provider_name(),
                "current_model": provider.get_model_id(),
                "message": "Model listing not available for this provider"
            }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


@app.post("/parse-payment", response_model=ParsePaymentResponse)
async def parse_payment(request: ParsePaymentRequest):
    """
    Parse a payment screenshot.
    
    Accepts a base64 encoded image and returns structured payment data.
    
    Args:
        request: ParsePaymentRequest with image_base64 and optional match_date
        
    Returns:
        ParsePaymentResponse with extracted data or error
    """
    logger.info(f"Received parse-payment request (match_date: {request.match_date})")
    
    # Process the image
    response = await payment_parser.parse_payment_screenshot(
        image_base64=request.image_base64,
        match_date=request.match_date
    )
    
    # Log result
    if response.success:
        logger.info(
            f"Successfully parsed payment: amount={response.data.amount}, "
            f"confidence={response.metadata.confidence}"
        )
    else:
        logger.warning(
            f"Failed to parse payment: {response.error_code} - {response.error_message}"
        )
    
    return response


@app.get("/")
async def root():
    """Root endpoint - basic service info."""
    return {
        "service": "ai-payment-parser",
        "version": "1.0.0",
        "status": "running" if AI_SERVICE_ENABLED else "disabled",
        "endpoints": {
            "health": "/health",
            "status": "/status",
            "parse": "/parse-payment"
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
