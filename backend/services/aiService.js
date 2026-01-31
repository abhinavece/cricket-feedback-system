/**
 * AI Service Client
 * 
 * Calls the AI Service pod to parse payment screenshots.
 * Handles communication, timeouts, and fallback responses.
 * 
 * NOTE: This replaces the old ocrService.js
 * 
 * Cloud Run Integration:
 * When running on Cloud Run, this service automatically adds ID token 
 * authentication for calling internal Cloud Run services.
 */

const axios = require('axios');

// AI Service URL - in k8s this resolves to the ai-service pod
// In Cloud Run, this should be the Cloud Run service URL
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8010';

// Check if we're running on Cloud Run (has metadata server)
const isCloudRun = !!process.env.K_SERVICE;

/**
 * Get ID token for Cloud Run service-to-service authentication
 * Uses the metadata server to obtain a token for the target audience
 * 
 * @param {string} targetAudience - The URL of the service to call
 * @returns {Promise<string|null>} - ID token or null if not on Cloud Run
 */
const getIdToken = async (targetAudience) => {
  if (!isCloudRun) {
    return null; // Not on Cloud Run, no token needed
  }
  
  try {
    // Get token from metadata server
    const metadataUrl = `http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/identity?audience=${encodeURIComponent(targetAudience)}`;
    const response = await axios.get(metadataUrl, {
      headers: { 'Metadata-Flavor': 'Google' },
      timeout: 5000
    });
    return response.data;
  } catch (error) {
    console.error('Failed to get ID token from metadata server:', error.message);
    return null;
  }
};

// Timeout for AI requests (30 seconds)
const AI_REQUEST_TIMEOUT = parseInt(process.env.AI_REQUEST_TIMEOUT || '30000');

/**
 * Default/fallback response structure
 * Matches the static schema expected by the frontend
 */
const createFallbackResponse = (errorCode, errorMessage, reviewReason = null) => ({
  success: false,
  error_code: errorCode,
  error_message: errorMessage,
  data: {
    amount: 0,
    currency: 'INR',
    payer_name: '',
    payee_name: '',
    date: '',
    time: '',
    transaction_status: 'unknown',
    transaction_id: '',
    payment_method: 'unknown',
    upi_id: ''
  },
  metadata: {
    confidence: 0,
    is_payment_screenshot: false,
    processing_time_ms: 0,
    provider: '',
    model: '',
    requires_review: true,
    review_reason: reviewReason || errorCode
  }
});

/**
 * Parse a payment screenshot using the AI Service
 * 
 * @param {Buffer} imageBuffer - Image data as Buffer
 * @param {Date|string} matchDate - Match date for validation (optional)
 * @returns {Promise<Object>} - Parsed payment data with static schema
 */
const parsePaymentScreenshot = async (imageBuffer, matchDate = null) => {
  try {
    console.log('\n🤖 Calling AI Service for payment parsing...');
    
    // Prepare request
    const requestData = {
      image_base64: imageBuffer.toString('base64'),
      match_date: matchDate ? new Date(matchDate).toISOString() : null
    };
    
    // Prepare headers
    const headers = {
      'Content-Type': 'application/json'
    };
    
    // Add ID token for Cloud Run service-to-service auth
    if (isCloudRun && AI_SERVICE_URL.includes('.run.app')) {
      console.log('🔐 Adding ID token for Cloud Run auth...');
      const idToken = await getIdToken(AI_SERVICE_URL);
      if (idToken) {
        headers['Authorization'] = `Bearer ${idToken}`;
      } else {
        console.warn('⚠️ Could not obtain ID token, request may fail');
      }
    }
    
    // Call AI Service
    const response = await axios.post(
      `${AI_SERVICE_URL}/parse-payment`,
      requestData,
      {
        timeout: AI_REQUEST_TIMEOUT,
        headers
      }
    );
    
    const result = response.data;
    
    // Log result
    if (result.success) {
      console.log(`✅ AI Service parsed payment: ₹${result.data.amount}`);
      console.log(`   Confidence: ${(result.metadata.confidence * 100).toFixed(1)}%`);
      console.log(`   Provider: ${result.metadata.provider}/${result.metadata.model}`);
      if (result.metadata.requires_review) {
        console.log(`   ⚠️ Requires review: ${result.metadata.review_reason}`);
      }
    } else {
      console.log(`❌ AI Service error: ${result.error_code} - ${result.error_message}`);
    }
    
    return result;
    
  } catch (error) {
    // Handle specific error types
    if (error.code === 'ECONNREFUSED') {
      console.error('❌ AI Service not available (connection refused)');
      return createFallbackResponse(
        'service_error',
        'AI Service is not available',
        'service_error'
      );
    }
    
    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
      console.error('❌ AI Service timeout');
      return createFallbackResponse(
        'service_error',
        'AI Service request timed out',
        'service_error'
      );
    }
    
    if (error.response) {
      // Server responded with error
      console.error(`❌ AI Service error: ${error.response.status}`, error.response.data);
      return createFallbackResponse(
        'service_error',
        `AI Service returned ${error.response.status}: ${error.response.statusText}`,
        'service_error'
      );
    }
    
    // Generic error
    console.error('❌ AI Service call failed:', error.message);
    return createFallbackResponse(
      'service_error',
      `Failed to call AI Service: ${error.message}`,
      'service_error'
    );
  }
};

/**
 * Check AI Service health status
 * 
 * @returns {Promise<Object>} - Health status
 */
const checkHealth = async () => {
  try {
    const headers = {};
    
    // Add ID token for Cloud Run service-to-service auth
    if (isCloudRun && AI_SERVICE_URL.includes('.run.app')) {
      const idToken = await getIdToken(AI_SERVICE_URL);
      if (idToken) {
        headers['Authorization'] = `Bearer ${idToken}`;
      }
    }
    
    const response = await axios.get(`${AI_SERVICE_URL}/health`, {
      timeout: 5000,
      headers
    });
    return {
      available: true,
      status: response.data.status,
      timestamp: response.data.timestamp
    };
  } catch (error) {
    return {
      available: false,
      status: 'unavailable',
      error: error.message
    };
  }
};

/**
 * Get AI Service status (usage, limits, etc.)
 * 
 * @returns {Promise<Object>} - Service status
 */
const getServiceStatus = async () => {
  try {
    const headers = {};
    
    // Add ID token for Cloud Run service-to-service auth
    if (isCloudRun && AI_SERVICE_URL.includes('.run.app')) {
      const idToken = await getIdToken(AI_SERVICE_URL);
      if (idToken) {
        headers['Authorization'] = `Bearer ${idToken}`;
      }
    }
    
    const response = await axios.get(`${AI_SERVICE_URL}/status`, {
      timeout: 5000,
      headers
    });
    return {
      available: true,
      ...response.data
    };
  } catch (error) {
    return {
      available: false,
      error: error.message
    };
  }
};

/**
 * Check if the AI service response requires admin review
 * 
 * @param {Object} aiResponse - Response from parsePaymentScreenshot
 * @returns {boolean} - True if review is required
 */
const requiresReview = (aiResponse) => {
  if (!aiResponse) return true;
  if (!aiResponse.success) return true;
  if (aiResponse.metadata?.requires_review) return true;
  if (aiResponse.data?.amount <= 0) return true;
  return false;
};

/**
 * Get the review reason from AI response
 * 
 * @param {Object} aiResponse - Response from parsePaymentScreenshot
 * @returns {string} - Review reason
 */
const getReviewReason = (aiResponse) => {
  if (!aiResponse) return 'no_response';
  if (!aiResponse.success) return aiResponse.error_code || 'ai_failed';
  if (aiResponse.metadata?.review_reason) return aiResponse.metadata.review_reason;
  if (aiResponse.data?.amount <= 0) return 'validation_failed';
  return 'unknown';
};

module.exports = {
  parsePaymentScreenshot,
  checkHealth,
  getServiceStatus,
  requiresReview,
  getReviewReason,
  createFallbackResponse,
  AI_SERVICE_URL
};
