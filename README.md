# BELMES Frontend Application

## Overview

BELMES (BEL Manufacturing Execution System) is a React-based frontend application designed to interface with the BELMES backend services. This application provides a modern, responsive user interface for managing manufacturing operations.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Development Environment Setup](#development-environment-setup)
- [Application Structure](#application-structure)
- [Running the Application Locally](#running-the-application-locally)
- [Building for Production](#building-for-production)
- [Deployment](#deployment)
  - [Automated Deployment](#automated-deployment)
  - [Manual Deployment](#manual-deployment)
  - [Deployment Configuration](#deployment-configuration)
  - [Troubleshooting Deployment Issues](#troubleshooting-deployment-issues)
- [API Configuration](#api-configuration)
- [Environment Variables](#environment-variables)
- [Maintenance and Updates](#maintenance-and-updates)

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16.x or later)
- **npm** (v8.x or later)
- **Git** for version control
- **PowerShell 7** (for Windows users) or **Bash** (for Linux/Mac users)
- **SSH client** for deployment

For deployment, you'll also need:

- SSH access to the target server
- Sudo privileges on the target server
- Nginx installed on the target server

## Development Environment Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd BELMES
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   - Copy `.env.example` to `.env.local`
   - Update the variables as needed for your local environment

## Application Structure

The application follows a standard React + Vite project structure:

- `src/` - Source code
  - `components/` - Reusable UI components
  - `pages/` - Page components
  - `services/` - API and service integrations
  - `assets/` - Static assets (images, fonts, etc.)
  - `styles/` - Global styles and theme configuration
- `public/` - Static files that will be served as-is
- `dist/` - Build output (created after building)
- `deploy-belmes.ps1` - PowerShell deployment script

## Running the Application Locally

To start the development server:

```bash
npm run dev
```

This will start the application in development mode with hot-reload enabled. The application will be available at [http://localhost:5173](http://localhost:5173) by default.

For a production-like environment locally:

```bash
npm run build
npm run preview
```

This builds the app and serves it using Vite's built-in preview server.

## Building for Production

To build the application for production:

```bash
npm run build
```

This creates a `dist` directory with optimized production build. The build is minified and the filenames include content hashes for cache busting.

## Deployment

### Automated Deployment

The project includes a PowerShell deployment script (`deploy-belmes.ps1`) that automates the build and deployment process.

#### Basic Usage

```powershell
./deploy-belmes.ps1
```

This will:
1. Build the application locally
2. Transfer the build files to the remote server
3. Configure Nginx on the remote server
4. Restart Nginx to apply changes

#### Advanced Usage

The deployment script accepts several parameters to customize the deployment:

```powershell
./deploy-belmes.ps1 -RemoteUser "username" -RemoteHost "server-ip" -AppBasePath "/custom-path/"
```

Available parameters:

| Parameter | Description | Default Value |
|-----------|-------------|---------------|
| `-RemoteUser` | SSH username | `smc` |
| `-RemoteHost` | Server hostname or IP | `172.18.7.155` |
| `-RemotePath` | Remote path for deployment files | `/home/smc/belmes` |
| `-AppBasePath` | Base path for the application | `/belmes/` |
| `-BuildDir` | Local build directory | `dist` |
| `-ServerSetupScript` | Server setup script name | `server-setup.sh` |
| `-SkipBuild` | Skip the build step | `$false` |
| `-SkipTransfer` | Skip the file transfer step | `$false` |
| `-SkipDeploy` | Skip the server deployment step | `$false` |
| `-Password` | SSH password (optional, use SSH keys instead if possible) | `$null` |

#### Deployment Process Details

The automated deployment process consists of three main steps:

1. **Build Step**:
   - Updates the base path in `vite.config.js`
   - Installs dependencies
   - Builds the application with the correct base path

2. **Transfer Step**:
   - Creates the remote directory if it doesn't exist
   - Transfers the build files to the remote server
   - Transfers the server setup script to the remote server

3. **Deploy Step**:
   - Makes the server setup script executable
   - Runs the server setup script with sudo
   - The server setup script:
     - Creates a backup of the existing deployment
     - Copies the build files to the web server directory
     - Creates/updates the Nginx configuration
     - Sets appropriate permissions
     - Tests and reloads Nginx

### Manual Deployment

If you prefer to deploy manually or need to troubleshoot the automated deployment, follow these steps:

1. Build the application locally:
   ```bash
   npm run build
   ```

2. Transfer the build files to the server:
   ```bash
   scp -r dist/* user@server:/var/www/html/belmes/
   ```

3. Configure Nginx on the server:
   - Create a configuration file in `/etc/nginx/sites-available/belmes.conf`
   - Create a symbolic link to enable the site:
     ```bash
     sudo ln -s /etc/nginx/sites-available/belmes.conf /etc/nginx/sites-enabled/
     ```
   - Test the configuration:
     ```bash
     sudo nginx -t
     ```
   - Reload Nginx:
     ```bash
     sudo systemctl reload nginx
     ```

### Deployment Configuration

The Nginx configuration created by the deployment script includes:

1. **Static File Serving**:
   - Serves the application from the specified directory
   - Configures proper MIME types for all assets
   - Enables gzip compression for better performance

2. **API Proxying**:
   - Proxies API requests to the backend services
   - Configures CORS headers for cross-origin requests
   - Handles OPTIONS requests for CORS preflight

3. **API Endpoints**:
   - `/api/v5/` - Proxied to `http://172.18.7.91:7777/api/v5/`
   - `/api/v1/` - Proxied to `http://172.18.7.155:8002` with enhanced logging

4. **Security Headers**:
   - Sets appropriate security headers for better protection

### Troubleshooting Deployment Issues

#### Common Issues and Solutions

1. **SSH Connection Issues**:
   - Ensure SSH keys are properly set up
   - Check firewall settings
   - Verify the remote user has appropriate permissions

2. **Nginx Configuration Errors**:
   - Check Nginx error logs: `sudo tail -f /var/log/nginx/error.log`
   - Verify syntax: `sudo nginx -t`
   - Check permissions on the web directory

3. **API Proxy Issues**:
   - Verify the backend services are running
   - Check API logs: `sudo tail -f /var/log/nginx/api-access.log`
   - Test API endpoints directly

4. **File Permission Issues**:
   - Ensure the web directory has correct ownership:
     ```bash
     sudo chown -R www-data:www-data /var/www/html/belmes
     ```
   - Set correct permissions:
     ```bash
     sudo chmod -R 755 /var/www/html/belmes
     ```

## API Configuration

The application is configured to communicate with two API endpoints:

1. **API v5** - Main backend API:
   - Endpoint: `http://172.18.7.91:7777/api/v5/`
   - Used for core application functionality

2. **API v1** - Secondary API:
   - Endpoint: `http://172.18.7.155:8002`
   - Enhanced logging enabled
   - Used for specific application features

To modify API endpoints, update the Nginx configuration in the server setup script or directly on the server.

## Environment Variables

The application uses environment variables for configuration. Create a `.env.local` file for local development:

```
VITE_API_BASE_URL=/api/v5
VITE_API_V1_URL=/api/v1
VITE_APP_TITLE=BELMES
```

For production, these variables are embedded during the build process.

## Maintenance and Updates

### Updating the Application

1. Pull the latest changes:
   ```bash
   git pull origin main
   ```

2. Install any new dependencies:
   ```bash
   npm install
   ```

3. Build and deploy:
   ```bash
   ./deploy-belmes.ps1
   ```

### Backup and Restore

The deployment script automatically creates backups before updating the application. Backups are stored in `/var/backups/belmes` on the server.

To restore from a backup:

1. SSH into the server
2. Extract the backup:
   ```bash
   sudo tar -xzf /var/backups/belmes/belmes-YYYYMMDD-HHMMSS.tar.gz -C /var/www/html/
   ```
3. Reload Nginx:
   ```bash
   sudo systemctl reload nginx
   ```

### Monitoring

Monitor the application and server health:

- Nginx access logs: `/var/log/nginx/access.log`
- Nginx error logs: `/var/log/nginx/error.log`
- API access logs: `/var/log/nginx/api-access.log`
- API error logs: `/var/log/nginx/api-error.log`

Use tools like `tail -f` to watch logs in real-time:

```bash
sudo tail -f /var/log/nginx/api-error.log
```
