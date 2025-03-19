FROM node:23.9.0
WORKDIR /app/frontend
RUN ls
COPY frontend/ .
RUN npm install
RUN npm run build
FROM python:3.12.2
WORKDIR /app/backend
RUN pip install pipenv
COPY backend/ .
RUN pipenv install --system --deploy
EXPOSE 5000
WORKDIR /app
CMD ["python", "backend/app.py"]
