import logging
import os
import json
import requests
import copy
from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Setup logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)

# Initialize the FastAPI app
app = FastAPI(
    title="Gemini Vision Analysis Backend",
    description="Handles image analysis and chat using the Gemini API.",
)

# --- Configuration ---
# Assuming GEMINI_API_KEY is available as an environment variable in the container
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
MODEL_NAME = "gemini-2.0-flash"
GEMINI_API_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL_NAME}:generateContent"


# --- Pydantic Models ---
class BoundingBox(BaseModel):
    label: str = Field(..., description="Detected object label.")
    box: list[int] = Field(
        ...,
        description="[x_min, y_min, x_max, y_max] coordinates normalized to 0-1000.",
    )


class AnalysisResults(BaseModel):
    description: str = Field(..., description="A concise summary of the scene.")
    detected_objects: list[BoundingBox] = Field(
        ..., description="List of detected objects with bounding boxes."
    )


class ImageAnalysisRequest(BaseModel):
    file_data: str = Body(..., description="Base64 encoded image data.")
    file_type: str = Body(..., description="MIME type of the image (e.g., image/jpeg).")


class ChatRequest(ImageAnalysisRequest):
    prompt: str = Body(..., description="The user's chat message.")
    history: list[dict] = Field(..., description="Previous chat history for context.")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Core Schema Conversion Function (FIX for $defs and $ref) ---
def pydantic_to_gemini_schema(raw_schema: dict) -> dict:
    """
    Transforms a Pydantic V2 JSON schema (which uses $defs and $ref for nesting)
    into the flat, inlined schema format required by the Gemini API's
    responseSchema field, converting types to uppercase strings.
    """

    # Extract definitions used for references
    definitions = raw_schema.get("$defs", {})

    gemini_schema = copy.deepcopy(raw_schema)
    unsupported_keys = ["$defs", "title", "description", "$schema"]
    for key in unsupported_keys:
        if key in gemini_schema:
            del gemini_schema[key]

    def resolve_references(sub_schema):
        """Recursively resolves $ref and cleans up keys."""

        # 1. Resolve $ref for nested types (the BoundingBox in this case)
        if "$ref" in sub_schema:
            # Reference format is typically "#/$defs/TypeName"
            ref_path = sub_schema["$ref"].split("/")
            type_name = ref_path[-1]

            # The definition is copied and recursively cleaned
            if type_name in definitions:
                resolved_def = copy.deepcopy(definitions[type_name])

                # Recursively clean the resolved definition
                resolved_def = resolve_references(resolved_def)

                # Remove title from the inline definition
                if "title" in resolved_def:
                    del resolved_def["title"]

                # The resolved schema *is* the new sub_schema
                return resolved_def

        # 2. Recursively process properties/items and convert type names
        for key, value in sub_schema.items():
            if isinstance(value, dict):
                sub_schema[key] = resolve_references(value)

        # 3. Convert type names to uppercase (e.g., 'object' -> 'OBJECT')
        if "type" in sub_schema and isinstance(sub_schema["type"], str):
            sub_schema["type"] = sub_schema["type"].upper()

        return sub_schema

    return resolve_references(gemini_schema)


# --- API Call Helper ---
def call_gemini_api(payload: dict, max_retries: int = 3, delay: int = 1):
    if not GEMINI_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="Server Misconfiguration: GEMINI_API_KEY environment variable is not set. Cannot call Gemini API.",
        )

    api_call_url = f"{GEMINI_API_URL}?key={GEMINI_API_KEY}"

    for attempt in range(max_retries):
        try:
            response = requests.post(
                api_call_url, headers={"Content-Type": "application/json"}, json=payload
            )

            # Check for API-specific errors, which often return 400
            if response.status_code == 400:
                logging.error(f"Gemini API 400 Error Response: {response.text}")
                # Re-raise the error to include the 400 detail in the final 500
                response.raise_for_status()

            response.raise_for_status()

            gemini_result = response.json()

            # For structured responses (analyze-objects), we expect JSON text
            json_text = (
                gemini_result.get("candidates", [{}])[0]
                .get("content", {})
                .get("parts", [{}])[0]
                .get("text")
            )

            if not json_text:
                raise ValueError(
                    "Gemini API response did not contain expected text content."
                )

            return json.loads(json_text)

        except requests.exceptions.RequestException as e:
            logging.error(f"API Request Error (Attempt {attempt + 1}): {e}")
            if attempt < max_retries - 1:
                import time

                time.sleep(delay)
                delay *= 2
                continue
            # If the request failed after all retries, raise the error
            raise HTTPException(
                status_code=500,
                detail=f"Failed to communicate with the Gemini API after multiple retries: 400 - {response.text}"
                if "response" in locals() and response.status_code == 400
                else f"Failed to communicate with the Gemini API after multiple retries: {e}",
            )

        except (ValueError, json.JSONDecodeError) as e:
            logging.error(f"JSON Parsing Error or Missing Content: {e}")
            raise HTTPException(
                status_code=500,
                detail=f"Internal error processing Gemini response: Model did not return valid JSON or response was empty. Error: {e}",
            )

    raise HTTPException(
        status_code=500, detail="An unexpected internal server error occurred."
    )


# --- Health Check Endpoint ---
@app.get("/health")
def health_check():
    """Simple endpoint to check if the API is running and its configuration."""
    key_status = "Loaded" if GEMINI_API_KEY else "Missing (403 likely)"
    return {
        "status": "ok",
        "model": MODEL_NAME,
        "key_status": key_status,
        "message": "Backend is ready to receive requests.",
    }


# --- Gemini Vision Analysis Endpoint (FINAL FIX for Schema Errors) ---
@app.post("/analyze-objects", response_model=AnalysisResults)
def analyze_objects(request_data: ImageAnalysisRequest):
    clean_base64 = request_data.file_data.strip()

    user_instruction_for_structured_output = (
        "Analyze this image. Your sole task is to generate a single JSON object "
        "that strictly conforms to the given ResponseSchema. The 'description' must be a concise scene summary. "
        "For the 'detected_objects' array, list up to 5 prominent objects with their labels and normalized bounding box "
        "coordinates [x_min, y_min, x_max, y_max] scaled from 0 to 1000. Do not include any text outside the JSON object."
    )

    # 1. Get the Pydantic schema dictionary
    raw_schema = AnalysisResults.model_json_schema()

    # 2. FIX: Convert the Pydantic schema to the flattened, API-compatible schema
    gemini_schema = pydantic_to_gemini_schema(raw_schema)

    payload = {
        "contents": [
            {
                "role": "user",
                "parts": [
                    # Image data part
                    {
                        "inlineData": {
                            "mimeType": request_data.file_type,
                            "data": clean_base64,
                        }
                    },
                    # Text instruction part
                    {"text": user_instruction_for_structured_output},
                ],
            },
        ],
        "generationConfig": {
            "responseMimeType": "application/json",
            # 3. Use the cleaned and transformed schema
            "responseSchema": gemini_schema,
        },
    }

    raw_results = call_gemini_api(payload)
    return raw_results


# --- Chat Endpoint ---
@app.post("/chat")
def chat_with_image(request_data: ChatRequest):
    """
    Handles conversational requests, keeping the image data and history in context.
    """
    clean_base64 = request_data.file_data.strip()

    # Extract user prompt and previous history
    user_prompt = request_data.prompt

    # System instruction for the chat
    system_instruction = (
        "You are a helpful and detailed image analysis chatbot. You are viewing an image. "
        "Answer the user's question based on the visual information and the context of the conversation. "
        "Keep your responses concise and friendly."
    )

    # Reconstruct conversation history for the model
    contents = []

    # 1. Add System Instruction as the first turn (standard chat pattern)
    contents.append({"role": "system", "parts": [{"text": system_instruction}]})

    # 2. Add previous history
    contents.extend(request_data.history)

    # 3. Add the current user turn with the image
    contents.append(
        {
            "role": "user",
            "parts": [
                {"text": user_prompt},
                {
                    "inlineData": {
                        "mimeType": request_data.file_type,
                        "data": clean_base64,
                    }
                },
            ],
        }
    )

    payload = {
        "contents": contents,
    }

    # We use a non-structured call here to get a natural text response
    api_call_url = f"{GEMINI_API_URL}?key={GEMINI_API_KEY}"

    max_retries = 3
    delay = 1

    for attempt in range(max_retries):
        try:
            response = requests.post(
                api_call_url, headers={"Content-Type": "application/json"}, json=payload
            )
            response.raise_for_status()
            gemini_result = response.json()

            # Extract plain text response
            text = (
                gemini_result.get("candidates", [{}])[0]
                .get("content", {})
                .get("parts", [{}])[0]
                .get("text", "Could not generate a response.")
            )

            return {"response": text}

        except requests.exceptions.RequestException as e:
            logging.error(f"Chat API Request Error (Attempt {attempt + 1}): {e}")
            if attempt < max_retries - 1:
                import time

                time.sleep(delay)
                delay *= 2
                continue
            raise HTTPException(
                status_code=500,
                detail=f"Failed to communicate with the Gemini API for chat after multiple retries: {e}",
            )

        except Exception as e:
            logging.error(f"Chat Processing Error: {e}")
            raise HTTPException(
                status_code=500, detail=f"Internal error processing chat request: {e}"
            )
