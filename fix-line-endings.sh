#!/bin/bash

# Fix line endings in server-setup.sh
# This script converts Windows line endings (CRLF) to Unix line endings (LF)

echo "Fixing line endings in server-setup.sh..."
if [ -f "server-setup.sh" ]; then
    # Create a backup
    cp server-setup.sh server-setup.sh.bak
    echo "Backup created: server-setup.sh.bak"
    
    # Convert CRLF to LF
    tr -d '\r' < server-setup.sh.bak > server-setup.sh
    
    # Make executable
    chmod +x server-setup.sh
    
    echo "Line endings fixed successfully!"
    echo "You can now run: sudo ./server-setup.sh"
else
    echo "Error: server-setup.sh not found in current directory"
    exit 1
fi

exit 0 