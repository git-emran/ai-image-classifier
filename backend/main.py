import logging
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import base64
import numpy as np

import cv2

from ultralytics import YOLO

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)

app = FastAPI(
    title="AI Image Analysis & Q&A Backend",
    description="Handles image uploads, YOLO object detection, and Gemini Q&A.",
)

try:
    model = YOLO("yolov8n.pt")
    logging.info("YOLOv8n model loaded successfully.")
except Exception as e:
    logging.error(f"Failed to load YOLO model: {e}")
    model = None

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    """Simple endpoint to check if the API is running."""
    model_status = "ready" if model else "failed"
    return {
        "status": "ok",
        "message": "AI Analysis API is running.",
        "yolo_model": model_status,
    }


def annotate_image(image_np: np.ndarray, results) -> str:
    img = image_np.copy()

    color = (0, 255, 0)  # Green in BGR format
    font = cv2.FONT_HERSHEY_SIMPLEX
    font_scale = 0.5
    thickness = 2

    for r in results:
        x1, y1, x2, y2 = map(int, r["box"])
        conf = r["confidence"]
        cls_name = r["class_name"]

        cv2.rectangle(img, (x1, y1), (x2, y2), color, thickness)

        label = f"{cls_name} {conf:.2f}"

        (w, h), _ = cv2.getTextSize(label, font, font_scale, 1)

        cv2.rectangle(img, (x1, y1 - h - 10), (x1 + w, y1), color, -1)

        cv2.putText(
            img, label, (x1, y1 - 5), font, font_scale, (0, 0, 0), 1, cv2.LINE_AA
        )

    is_success, buffer = cv2.imencode(".jpg", img, [int(cv2.IMWRITE_JPEG_QUALITY), 90])
    if not is_success:
        logging.error("Failed to encode annotated image to JPEG.")
        return ""

    base64_img = base64.b64encode(buffer).decode("utf-8")
    return base64_img


@app.post("/detect")
async def detect_objects(file: UploadFile = File(...)):
    """
    Receives an image file, runs YOLO object detection, and returns structured
    results and the annotated image.
    """
    if model is None:
        raise HTTPException(
            status_code=503,
            detail="YOLO Model not loaded. Check backend logs and ensure internet connectivity for download.",
        )

    try:
        logging.info(
            f"Received file: {file.filename}, Content Type: {file.content_type}"
        )

        contents = await file.read()

        np_arr = np.frombuffer(contents, np.uint8)
        img_np = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

        if img_np is None:
            raise HTTPException(status_code=400, detail="Could not decode image file.")

        logging.info(f"Image successfully decoded. Shape: {img_np.shape}")

        results_list = model(img_np, conf=0.25, verbose=False)

        detection_results = []

        for result in results_list[0].boxes:
            box_coords = result.xyxy[0].cpu().numpy().tolist()

            confidence = result.conf[0].item()

            class_id = int(result.cls[0].item())
            class_name = model.names[class_id]

            detection_results.append(
                {
                    "class_name": class_name,
                    "confidence": confidence,
                    "box": [round(c) for c in box_coords],
                }
            )

        logging.info(
            f"YOLO detection complete. Found {len(detection_results)} objects."
        )

        annotated_image_base64 = annotate_image(img_np, detection_results)

        return JSONResponse(
            content={
                "message": "Image analyzed successfully.",
                "filename": file.filename,
                "detection_results": detection_results,
                "annotated_image_base64": annotated_image_base64,
            }
        )

    except Exception as e:
        logging.error(f"Error during object detection: {e}", exc_info=True)
        raise HTTPException(
            status_code=500, detail=f"Internal Server Error during detection: {e}"
        )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
