# For more information, please refer to https://aka.ms/vscode-docker-python
FROM python:3.11.2-slim

# Keeps Python from generating .pyc files in the container
ENV PYTHONDONTWRITEBYTECODE=1

# Turns off buffering for easier container logging
ENV PYTHONUNBUFFERED=1

WORKDIR /app
COPY . /app

# Upgrade pip and install dependencies from requirements.txt
RUN pip install -U pip
RUN pip install -r requirements.txt

# Make port 8080 available to the world outside this container
EXPOSE 8080

# Ensure Gunicorn is in your requirements.txt
# Define environment variable for the Flask application entry point
ENV FLASK_APP=app.py

# Use Gunicorn to serve the Flask app. Adjust the number of workers as necessary.
# "-w 4" means 4 worker processes. Adjust based on your environment's CPU cores.
# "0.0.0.0:8080" means bind to port 8080 on all network interfaces.
# "app:app" points to the Flask app instance.
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:8080", "app:app"]
