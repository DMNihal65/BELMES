# Define variables
$LocalFilePath = "index.html"  # Change to your local file path
$RemoteUser = "smc"           # Linux username
$RemoteHost = "172.18.7.155"           # Linux server IP or hostname
$RemotePath = "/home/smc/bel"    # Remote directory
$CommandsToRun = "ls -lah; whoami"      # Commands to execute remotely

# Secure SSH password (Optional: If using password authentication)
$Password = "smc"  # Avoid hardcoding passwords for security reasons
$SecurePassword = ConvertTo-SecureString $Password -AsPlainText -Force
$Credential = New-Object System.Management.Automation.PSCredential ($RemoteUser, $SecurePassword)

# Transfer file using SCP (Fixed syntax)
Write-Host "Transferring file to remote server..."
scp $LocalFilePath "${RemoteUser}@${RemoteHost}:${RemotePath}"

# Execute commands on remote server using SSH (Fixed syntax)
Write-Host "Executing commands on remote server..."
ssh "${RemoteUser}@${RemoteHost}" $CommandsToRun

Write-Host "File transfer and command execution completed successfully!"
