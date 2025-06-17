# Ingrid Legal FastAPI Backend

This is the FastAPI backend for the Ingrid Legal platform that provides legal document preparation and procedural compliance data.

## Setup

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run the server:
```bash
python main.py
```

The server will start on `http://localhost:8000`

## API Endpoints

### Health Check
- `GET /` - Root endpoint
- `GET /health` - Health check endpoint

### Main API
- `POST /api/prepareDocket` - Prepare legal docket based on jurisdiction and document type

## Database Structure

The system uses a hardcoded database (`LEGAL_DATABASE`) with the following structure:

Key: `(state, county, division, judge, document_type)`

Value: Dictionary containing:
- `documents`: List of mandatory documents
- `conditional`: List of conditional documents  
- `rules`: List of governing rules
- `checklist`: List of procedural checklist items

## Development

To add new legal data:
1. Add entries to the `LEGAL_DATABASE` dictionary in `main.py`
2. Follow the existing structure for consistency
3. Restart the server to apply changes

## Production Deployment

For production deployment, consider:
1. Using environment variables for configuration
2. Implementing proper logging
3. Adding authentication/authorization
4. Moving to a real database (PostgreSQL, MongoDB, etc.)
5. Adding input validation and sanitization
6. Implementing rate limiting