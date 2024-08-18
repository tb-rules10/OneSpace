FROM ubuntu:focal

RUN apt-get update
RUN apt-get install -y curl git
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
RUN apt-get upgrade -y
RUN apt-get install -y nodejs

WORKDIR /home/app

COPY main.sh script.js package*.json ./
COPY utils/ utils/

# Install Node.js dependencies
RUN npm install

# Make scripts executable
RUN chmod +x main.sh script.js

# Set entrypoint
ENTRYPOINT [ "/home/app/main.sh" ]