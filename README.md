# AU Events Portal

A clean, modern event management system for universities. Create events, share them, and manage registrations with QR code check-ins.

## Features

- **Event Management**: Create, edit, and delete events
- **Student Registration**: Simple registration form with validation
- **QR Code Generation**: Automatic QR codes for check-ins
- **Admin Dashboard**: View registrations, export data to CSV
- **Shareable Links**: Direct links to events
- **Responsive Design**: Works on mobile and desktop

## File Structure

```
EventFlow/
├── index.html          # Main entry point
├── css/
│   └── styles.css      # Stylesheet
├── js/
│   └── app.js          # Application logic
├── test/               # Test files
│   ├── auto-test.html
│   ├── auto-run.html
│   ├── temp-test.html
│   ├── test-data.html
│   ├── test-eventflow.bat
│   ├── reset-and-test.bat
│   ├── auto-test.bat
│   ├── test.bat
│   └── run-auto-test.ps1
└── assets/             # Images, etc. (empty by default)
```

## How to Run

1. Open `index.html` in your browser
2. Or double-click `test/test-eventflow.bat` (Windows)

## Admin Login

- Username: `admin`
- Password: `admin123`

## Test Data

Use `test/temp-test.html` or `test/test-data.html` to automatically create a sample event.

## Usage

1. **Create Event**: Login as admin → Create Event → Fill details → Save
2. **Share Event**: My Events → Click share icon → Copy link
3. **Register**: Open event link → Register Now → Fill student details
4. **View Registrations**: Admin Dashboard → Registrations tab
5. **Export**: Registrations tab → Export CSV button
