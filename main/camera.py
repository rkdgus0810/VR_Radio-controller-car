import cv2
import numpy as np

# Capture video from the webcam
cap = cv2.VideoCapture(0)

while True:
    # Read a frame from the video
    ret, frame = cap.read()
    if not ret:
        break
    
    # Step 1: Apply bilateral filter to smooth the image
    bilateral_filter = cv2.bilateralFilter(frame,5 , 50, 50)
    
    # Step 2: Convert the image to grayscale and apply median blur
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    gray = cv2.medianBlur(gray, 7)
    
    # Step 3: Detect edges using adaptive thresholding
    edges = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_MEAN_C,
                                  cv2.THRESH_BINARY, 9, 9)
    
    # Step 4: Combine the bilateral filter with the edge image
    cartoon = cv2.bitwise_and(bilateral_filter, bilateral_filter, mask=edges)
    
    # Display the cartoon effect
    cv2.imshow('Cartoon Effect', cartoon)
    
    # Exit if the user presses the 'q' key
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

# Release the video capture and close the windows
cap.release()
cv2.destroyAllWindows()
