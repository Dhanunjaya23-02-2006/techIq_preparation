def api_response(data=None, message="", success=True, status=200):
    """Standardized API response wrapper."""
    return {
        "success": success,
        "message": message,
        "data": data if data is not None else {},
    }, status


def error_response(message="Something went wrong", errors=None, status=400):
    """Standardized error response."""
    return {
        "success": False,
        "message": message,
        "errors": errors if errors else {},
    }, status
