import serial
import requests
import json

# Configuration
PORT = 'COM10'  
BAUD_RATE = 9600
API_URL = 'http://localhost:3000/api/recent-scans' 

def send_to_api(uid):
    """Send the UID to the API endpoint"""
    try:
        payload = {"uid": uid}
        response = requests.post(API_URL, json=payload, timeout=5)
        
        if response.status_code == 200:
            print(f"✓ Successfully sent to API: {response.json()}")
        else:
            print(f"✗ API Error ({response.status_code}): {response.text}")
            
    except requests.exceptions.RequestException as e:
        print(f"✗ Network error: {e}")
    except Exception as e:
        print(f"✗ Unexpected error: {e}")

try:
    arduino = serial.Serial(PORT, BAUD_RATE, timeout=1)
    print(f"Listening on {PORT}...")
    print(f"API endpoint: {API_URL}")

    while True:
        line = arduino.readline().decode('utf-8').strip()
        if line:
            print(f"RFID Tag Detected: {line}")
            send_to_api(line)

except serial.SerialException as e:
    print(f"Serial error: {e}")
except KeyboardInterrupt:
    print("Exiting...")
finally:
    if 'arduino' in locals() and arduino.is_open:
        arduino.close()