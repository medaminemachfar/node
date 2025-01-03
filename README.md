# Multi-Container Application Development: Bookshop Management System

This project involves the development and deployment of a multi-container application for managing a bookshop. The application consists of a Node.js frontend, a PostgreSQL backend, and is deployed using OpenShift container orchestration.

## Prerequisites

1. **OpenShift Cluster**: Ensure you have access to an OpenShift cluster.
2. **OpenShift CLI (`oc`)**: Installed and configured on your local machine.
3. **Docker**: Installed for building container images locally.
4. **Git**: Installed for cloning the project repository.
5. **Node.js**: Installed for testing the frontend locally if needed.
6. **PostgreSQL**: Installed for testing the database locally if needed.

## Project Setup

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd <repository-directory>
```

### Step 2: Build Docker Images

Build the Docker images for the backend and frontend services.

#### Backend:
```bash
docker build -t bookshop-backend ./backend
```

#### Frontend:
```bash
docker build -t bookshop-frontend ./frontend
```

### Step 3: Push Docker Images to OpenShift

Login to your OpenShift cluster and push the images to the internal registry.

#### Login:
```bash
oc login --token=<your-token> --server=<your-openshift-server>
```

#### Tag and Push Images:
```bash
oc project <your-project-name>

docker tag bookshop-backend <image-registry.openshift-project-url>/bookshop-backend:latest

docker push <image-registry.openshift-project-url>/bookshop-backend:latest

# Repeat for frontend
docker tag bookshop-frontend <image-registry.openshift-project-url>/bookshop-frontend:latest
docker push <image-registry.openshift-project-url>/bookshop-frontend:latest
```

### Step 4: Deploy Resources

#### 1. Create Secrets
Create a secret for database credentials:
```bash
oc create secret generic db-credentials \
--from-literal=user=postgres \
--from-literal=password=<your-db-password>
```

#### 2. Apply YAML Configuration Files
Deploy the backend, frontend, and database using the provided YAML files.

```bash
oc apply -f deployment/backend-deployment.yml
oc apply -f deployment/frontend-deployment.yml
oc apply -f deployment/postgresql-deployment.yml
oc apply -f deployment/db-service.yml
oc apply -f deployment/frontend-service.yml
oc apply -f deployment/route.yml
```

### Step 5: Verify Deployments

Use the following commands to check the status of your deployments:

```bash
oc get pods
oc get services
oc get routes
```

### Step 6: Access the Application

Find the route URL using:
```bash
oc get routes
```
Access the application in your web browser using the displayed route URL.

## Localhost Setup

To run the application on your local machine:

1. Navigate to the repository directory.
2. Run the following commands:

```bash
npm install
npm start
```

This will launch the application on port 8080.

Other options:

- `npm run dev`: Runs the application with pretty output logs.
- `npm run dev:debug`: Shows debug information while running.

## OpenShift Local Setup

If you are using OpenShift Local, ensure the cluster is started and you are logged in with an active project. Follow these steps:

```bash
crc setup       # Set up the hypervisor
crc start       # Initialize the OpenShift cluster
oc login -u developer       # Login
oc new-project my-example-project       # Create a project to deploy to
npm run openshift       # Deploys the example app
```

## OpenTelemetry with OpenShift Distributed Tracing Platform

Instructions for installing the OpenShift Distributed Tracing Platform and enabling tracing can be found [here](./OTEL.md).

## Usage Instructions

1. **Managing Books:** Use the frontend to add, edit, or delete books in the system.
2. **Scaling Services:** Adjust the number of replicas for the backend or frontend using:
   ```bash
   oc scale deployment <deployment-name> --replicas=<number-of-replicas>
   ```
3. **Monitoring:** Use OpenShift's web console or CLI tools to monitor resource usage and application logs.

## Maintenance

- **Database Backups:** Ensure regular backups of the PostgreSQL database.
- **Logs:** Use the following command to check logs for debugging:
  ```bash
  oc logs <pod-name>
  ```
- **Updates:** Rebuild and redeploy Docker images for new updates.

## Troubleshooting

- **Pods Not Running:** Check pod events and logs:
  ```bash
  oc describe pod <pod-name>
  oc logs <pod-name>
  ```
- **Service Not Accessible:** Verify routes and services:
  ```bash
  oc get routes
  oc get services
  ```
