import os
import google.generativeai as genai
from config import GOOGLE_AI_STUDIO_API_KEY

print(f"Using API Key: {GOOGLE_AI_STUDIO_API_KEY[:5]}...{GOOGLE_AI_STUDIO_API_KEY[-5:]}")

genai.configure(api_key=GOOGLE_AI_STUDIO_API_KEY)

print("\nList of available models:")
try:
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(f"- {m.name}")
except Exception as e:
    print(f"Error listing models: {e}")

print("\nTrying to instantiate gemini-1.5-flash...")
try:
    model = genai.GenerativeModel("gemini-1.5-flash")
    print("Success instantiating model object.")
    
    print("Attempting simple text generation...")
    response = model.generate_content("Hello, can you hear me?")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error with gemini-1.5-flash: {e}")

