# OneSpace
Developed a platform for hosting serverless websites with a focus on ease of deployment and management. It offers a seamless experience for users to deploy their applications and ensures optimal performance and scalability.

## Features

- **Seamless Hosting:** Simplifies the deployment and management of serverless websites, making it easier for users to manage their applications.
  
- **Optimized Performance and Scalability:** Utilizes **containerized** deployment and fast **data caching** to enhance the platform’s performance and scalability.

- **Reverse Proxy Integration:** Implements a **reverse proxy** that maps AWS services to custom domains, allowing users to use their own unique domains with the platform.

## Components

### API Server
Handles backend logic and data processing, exposing endpoints for client interactions and managing data storage and retrieval.

### Builder Server
Manages the building and deployment of serverless applications using AWS ECS.

### Reverse Proxy
Maps AWS services to custom domains, improving load balancing, and overall application performance.

### Frontend
Provides the user interface for interacting with the application and managing deployments.

## Installation

To set up the project locally, follow these steps:

```bash
git clone https://github.com/tb-rules10/OneSpace
cd OneSpace

cd api-server
npm i 
node index.js

cd reverse-proxt
npm i
node index.js

cd frontend
npm i
npm run dev
```
![image](https://github.com/user-attachments/assets/182d0192-a813-44e2-be30-be50f91ab952)
<hr/>

![image](https://github.com/user-attachments/assets/4ea6d5c2-d1b5-4caf-b316-13e8b76e4011)
<hr/>

![image](https://github.com/user-attachments/assets/dc1b372f-6a62-43d8-837b-df7035b6935d)

