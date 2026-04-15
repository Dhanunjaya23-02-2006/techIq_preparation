import os
import multiprocessing

# Gunicorn configuration for FastAPI/Uvicorn
bind = f"0.0.0.0:{os.getenv('PORT', '8000')}"

# Railway containers report host CPU count, which can result in 30+ workers
# and crash the container. We limit this by checking WEB_CONCURRENCY or 
# defaulting to a sensible small number for 512MB RAM constraints.
workers = int(os.getenv("WEB_CONCURRENCY", 2))

worker_class = "uvicorn.workers.UvicornWorker"
timeout = 120
keepalive = 5

# Logging
accesslog = "-"
errorlog = "-"
loglevel = "info"
