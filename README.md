# GYM-CARD-CREDIT

**Empowering Seamless Gym Access and Credit Management**

## Built With

- **Frontend**: Next.js, TypeScript, Tailwind CSS
- **Backend**: Node.js, MongoDB
- **Hardware**: Python, C++, Arduino, RFID Scanner
- **Database**: MongoDB

## Overview

Gym-Card-Credit is an integrated platform that combines RFID hardware detection with a modern web interface to streamline gym access and credit management. The system enables real-time RFID scanning, user account handling, and credit transactions within a scalable architecture.

## Why Gym-Card-Credit?

This project empowers developers to build secure, efficient gym management systems. The core features include:

- **Hardware Integration**: Facilitates real-time RFID tag detection via Arduino, enabling automated access control
- **Robust Web App**: A Next.js-based interface for managing user credits and viewing credit history
- **Consistent UI Components**: Modular, styled React components with Tailwind CSS support ensure a cohesive user experience
- **Comprehensive API Layer**: Endpoints for user management, scan validation, and credit top-ups streamline backend operations
- **Database Connectivity**: MongoDB integration for reliable data storage and retrieval of user and transaction data

## Getting Started

### Prerequisites

This project requires the following:

- Node.js (v14 or higher)
- Python with Serial library
- Arduino IDE
- Arduino Board
- RFID Scanner
- Jumper wires

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/islamdev2022/Gym-card-credit
   cd gym-card-credit
   ```

2. **Set up Arduino Hardware**
   - Open the `send` folder in Arduino IDE
   - Upload the code to your Arduino board
   - Connect the Arduino board with the RFID scanner using jumper wires
   - Unplug the USB and plug it back in

3. **Configure Python Serial Communication**
   - Run the `get-sent.py` script
   - **Note**: Update the COM port in the script based on your USB port
   ```bash
   python get-sent.py
   ```

4. **Set up the Web Application**
   - Navigate to the gym-card-credit directory
   - Install dependencies and run the development server:
   ```bash
   npm install
   npm run dev
   ```

5. **Environment Configuration**
   - Create a `.env.local` file in the root directory
   - Add your MongoDB connection string and other environment variables:
   ```env
   MONGODB_URI=your_mongodb_connection_string
   NEXT_PUBLIC_API_URL=http://localhost:3000
   ```

## API Routes

### User Management (`/api/users`)
- **`GET /api/users`** - Retrieve all users sorted by creation date (newest first)
- **`POST /api/users`** - Create new user with name, RFID UID, and initial credit
  - Validates unique RFID UID and name
  - Returns error if card or name already registered
- **`DELETE /api/users`** - Delete user by RFID UID

### Individual User Operations (`/api/user`)
- **`POST /api/user`** - Get user details by RFID UID
- **`GET /api/user?name={name}`** - Get user details by name

### RFID Scanning (`/api/scan`)
- **`POST /api/scan`** - Validate RFID scan and check access eligibility
  - Verifies card registration and minimum credit (5 credits)
  - Returns user info without deducting credits
- **`PATCH /api/scan`** - Process gym entry and deduct credits
  - Deducts specified amount (default: 5 credits)
  - Updates scan history and last scan timestamp

### Recent Scans Tracking (`/api/recent-scans`)
- **`GET /api/recent-scans?since={timestamp}`** - Get recent scans after specified timestamp
  - Returns and removes processed scans to prevent reprocessing
  - Maintains in-memory storage (max 50 scans)
- **`POST /api/recent-scans`** - Add new scan to recent scans queue

### Credit Top-up (`/api/topup`)
- **`PATCH /api/topup`** - Add credits to user account
  - Requires RFID UID and positive amount
  - Records top-up history with timestamp

### Key Features:
- **Two-Phase Scanning**: First validates access (POST), then processes entry (PATCH)
- **Credit Validation**: Ensures minimum 5 credits before gym access
- **Audit Trail**: Tracks all scans and top-ups with timestamps
- **Error Handling**: Comprehensive validation and error responses
- **Memory Management**: Recent scans auto-cleanup to prevent memory issues

## Project Structure

```
gym-card-credit/
├── components/          # React components
├── app/
│   ├── api/            # API routes
│   └── ...             # Next.js pages
├── lib/                # Utility functions and database connections
send/send.ino               # Arduino code
get-sent.py         # Python serial communication script

```

## Hardware Setup

### RFID Scanner Connection
Connect your RFID scanner to the Arduino using the following pin configuration:

| RFID Pin | Arduino Pin |
|----------|-------------|
| VCC      | 3.3V        |
| GND      | GND         |
| RST      | Pin 9       |
| SDA      | Pin 10      |
| MOSI     | Pin 11      |
| MISO     | Pin 12      |
| SCK      | Pin 13      |

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions, please open an issue in the GitHub repository.

---

**Note**: Make sure to update the COM port in `get-sent.py` according to your system's USB port configuration before running the Python script.