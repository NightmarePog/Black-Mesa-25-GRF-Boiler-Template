FROM node:23.9.0
WORKDIR /app/frontend
COPY frontend .
RUN npm install
RUN npm run build

FROM python:3.12.2
WORKDIR /app/backend
RUN mkdir /app/frontend
COPY --from=0 /app/frontend /app/frontend
RUN pip install pipenv flask_sqlalchemy flask_socketio
COPY backend .
RUN ls && pipenv install --system --deploy
EXPOSE 5000
WORKDIR /app
CMD ["python", "backend/app.py"]
