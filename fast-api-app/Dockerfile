FROM python:3.12
WORKDIR /code
COPY ./requirements.txt /code/requirements.txt
RUN pip install --no-cache-dir -r /code/requirements.txt
COPY . /code/app
CMD ["fastapi", "run", "app/main.py", "--port", "80", "--host", "0.0.0.0"]