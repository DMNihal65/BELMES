#!/usr/bin/env pwsh
# Frontend Development Deployment Script - Local Docker Build

# Configuration
$SERVER_IP = "172.18.7.89"
$REMOTE_USER = "smc" # Replace with your SSH username
$REMOTE_BASE_DIR = "/home/smc/belfrontend"
$REMOTE_CURRENT_DIR = "$REMOTE_BASE_DIR/current"
$REMOTE_BACKUP_DIR = "$REMOTE_BASE_DIR/backup"
$CONTAINER_NAME = "belfrontend"
$APP_NAME = "belfrontend"

# Generate timestamp for versioning
$TIMESTAMP = Get-Date -Format "yyyyMMdd_HHmmss"
$VERSION = "$APP_NAME-$TIMESTAMP"
$IMAGE_NAME = "${APP_NAME}:${VERSION}"
$TAR_FILENAME = "$VERSION.tar"

Write-Host "===== Starting deployment process ====="
Write-Host "Version: $VERSION"
Write-Host "Image: $IMAGE_NAME"

# Step 1: Test server connectivity
Write-Host "Testing server connectivity..."
$pingResult = Test-Connection -ComputerName $SERVER_IP -Count 2 -Quiet
if (-not $pingResult) {
    Write-Host "Cannot reach server $SERVER_IP. Please check connectivity." -ForegroundColor Red
    exit 1
}
Write-Host "Server connectivity OK"

# Step 2: Build Docker image locally
Write-Host "Building Docker image locally..."
try {
    # Build the Docker image
    docker build -t $IMAGE_NAME .
    
    # Verify the image was built successfully
    $imageExists = docker images --format "{{.Repository}}:{{.Tag}}" | Select-String -Pattern "^$IMAGE_NAME$"
    if (-not $imageExists) {
        throw "Docker image was not created successfully"
    }
    
    Write-Host "Docker image built successfully: $IMAGE_NAME" -ForegroundColor Green
} catch {
    Write-Host "Failed to build Docker image: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 3: Save Docker image to tar file
Write-Host "Saving Docker image to tar file..."
try {
    docker save -o $TAR_FILENAME $IMAGE_NAME
    
    # Verify tar file was created and has reasonable size
    if (-not (Test-Path $TAR_FILENAME)) {
        throw "Tar file was not created"
    }
    
    $fileSize = (Get-Item $TAR_FILENAME).Length / 1MB
    Write-Host "Image saved to $TAR_FILENAME (Size: $([math]::Round($fileSize, 2)) MB)"
} catch {
    Write-Host "Failed to save Docker image: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 4: Setup remote directories
Write-Host "Setting up remote directories..."
$setupDirs = @"
mkdir -p $REMOTE_BASE_DIR $REMOTE_CURRENT_DIR $REMOTE_BACKUP_DIR
echo "Directories created successfully"
"@

try {
    ssh $REMOTE_USER@$SERVER_IP $setupDirs
    Write-Host "Remote directories setup completed"
} catch {
    Write-Host "Failed to setup remote directories: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 5: Transfer the Docker image tar file to the server
Write-Host "Transferring Docker image to server..."
Write-Host "This may take a while depending on image size and network speed..."
try {
    scp $TAR_FILENAME ${REMOTE_USER}@${SERVER_IP}:${REMOTE_CURRENT_DIR}/
    Write-Host "Docker image transfer completed" -ForegroundColor Green
} catch {
    Write-Host "Failed to transfer Docker image: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 6: Stop current container and backup previous version
Write-Host "Stopping current container and backing up..."
$backupScript = @"
# Stop and remove current container if running
if docker ps -q -f name=$CONTAINER_NAME | grep -q .; then
    echo 'Stopping current container...'
    docker stop $CONTAINER_NAME
    docker rm $CONTAINER_NAME
    echo 'Current container stopped and removed'
else
    echo 'No running container found'
fi

# Backup current image tar if it exists
if [ -f '$REMOTE_CURRENT_DIR/current.tar' ]; then
    BACKUP_FILENAME=`$(date +%Y%m%d_%H%M%S)_backup.tar
    mv '$REMOTE_CURRENT_DIR/current.tar' '$REMOTE_BACKUP_DIR/`$BACKUP_FILENAME'
    echo "Previous image backed up as `$BACKUP_FILENAME"
fi

# Set new image tar as current
ln -sf '$REMOTE_CURRENT_DIR/$TAR_FILENAME' '$REMOTE_CURRENT_DIR/current.tar'
echo 'New image set as current'
"@

try {
    ssh $REMOTE_USER@$SERVER_IP $backupScript
    Write-Host "Backup and cleanup completed"
} catch {
    Write-Host "Failed during backup process: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 7: Load Docker image and deploy new version
Write-Host "Loading Docker image and deploying new version..."
$deployScript = @"
cd $REMOTE_CURRENT_DIR

# Load the Docker image from tar file
echo 'Loading Docker image...'
docker load -i $TAR_FILENAME

# Verify image was loaded
if docker images --format '{{.Repository}}:{{.Tag}}' | grep -q '$IMAGE_NAME'; then
    echo 'Docker image loaded successfully: $IMAGE_NAME'
else
    echo 'Failed to load Docker image'
    exit 1
fi

# Run the new container
echo 'Starting new container...'
docker run -d \
    --name $CONTAINER_NAME \
    -p 5173:5173 \
    --restart unless-stopped \
    $IMAGE_NAME

# Verify container is running
sleep 3
if docker ps -q -f name=$CONTAINER_NAME | grep -q .; then
    echo 'Container started successfully'
    docker ps -f name=$CONTAINER_NAME --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}'
else
    echo 'Failed to start container'
    echo 'Container logs:'
    docker logs $CONTAINER_NAME
    exit 1
fi

# Cleanup old Docker images (keep last 3 versions)
echo 'Cleaning up old Docker images...'
# Remove old images of the same app, keeping the 3 most recent
docker images --format '{{.Repository}}:{{.Tag}} {{.CreatedAt}}' | grep "^$($APP_NAME):" | sort -k2 -r | tail -n +4 | awk '{print `$1}' | xargs -r docker rmi 2>/dev/null || true

# Clean up dangling images
docker image prune -af --filter "until=24h" 2>/dev/null || true

# Remove the tar file to save space
rm -f $TAR_FILENAME

echo 'Deployment completed successfully'
"@

try {
    ssh $REMOTE_USER@$SERVER_IP $deployScript
    Write-Host "Deployment completed successfully" -ForegroundColor Green
} catch {
    Write-Host "Deployment failed: $($_.Exception.Message)" -ForegroundColor Red
    
    # Try to get container logs for debugging
    Write-Host "Attempting to retrieve container logs for debugging..."
    try {
        ssh $REMOTE_USER@$SERVER_IP "docker logs $CONTAINER_NAME 2>&1 || echo 'No logs available'"
    } catch {
        Write-Host "Could not retrieve container logs"
    }
    exit 1
}

# Step 8: Cleanup local temporary files
Write-Host "Cleaning up local temporary files..."
Remove-Item -Path $TAR_FILENAME -Force -ErrorAction SilentlyContinue

# Optional: Remove local Docker image to save space (uncomment if desired)
# Write-Host "Removing local Docker image to save space..."
# docker rmi $IMAGE_NAME -f

# Step 9: Verify deployment
Write-Host "Verifying deployment..."
$verifyScript = @"
echo '=== Container Status ==='
docker ps -f name=$CONTAINER_NAME --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}'

echo ''
echo '=== Container Health Check ==='
# Wait a moment for the container to fully start
sleep 2
if docker ps -q -f name=$CONTAINER_NAME -f status=running | grep -q .; then
    echo 'Container is running successfully ✓'
else
    echo 'Container is not running properly ✗'
fi

echo ''
echo '=== Recent Container Logs ==='
docker logs --tail 15 $CONTAINER_NAME

echo ''
echo '=== Application Access Information ==='
echo "Application should be accessible at: http://$SERVER_IP:5173"
"@

ssh $REMOTE_USER@$SERVER_IP $verifyScript

Write-Host ""
Write-Host "===== Deployment completed successfully! ====="
Write-Host "Application version $VERSION is now running on $SERVER_IP:5173" -ForegroundColor Green
Write-Host "You can access the application at: http://$SERVER_IP:5173" -ForegroundColor Cyan

# Display deployment summary
Write-Host ""
Write-Host "=== Deployment Summary ===" -ForegroundColor Yellow
Write-Host "Version: $VERSION"
Write-Host "Image: $IMAGE_NAME"
Write-Host "Server: $SERVER_IP"
Write-Host "Container: $CONTAINER_NAME"
Write-Host "Port: 5173"