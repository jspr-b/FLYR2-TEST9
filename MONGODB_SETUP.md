# MongoDB Atlas Setup Guide

## Option 1: MongoDB Atlas (Recommended - Cloud)

### Step 1: Create MongoDB Atlas Account
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Sign up for a free account
3. Create a new project called "FLYR Dashboard"

### Step 2: Create a Cluster
1. Click "Build a Database"
2. Choose "FREE" tier (M0)
3. Select your preferred cloud provider (AWS, Google Cloud, or Azure)
4. Choose a region close to you
5. Click "Create"

### Step 3: Set Up Database Access
1. Go to "Database Access" in the left sidebar
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Create a username and password (save these!)
5. Select "Read and write to any database"
6. Click "Add User"

### Step 4: Set Up Network Access
1. Go to "Network Access" in the left sidebar
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (for development)
4. Click "Confirm"

### Step 5: Get Connection String
1. Go to "Database" in the left sidebar
2. Click "Connect"
3. Choose "Drivers"
4. Copy the connection string
5. Replace `<password>` with your database user password
6. Replace `<dbname>` with `flyr-dashboard`

### Step 6: Update Environment File
Update your `.env.local` file:

```env
MONGODB_URI=mongodb+srv://yourusername:yourpassword@cluster.mongodb.net/flyr-dashboard?retryWrites=true&w=majority
```

## Option 2: Local MongoDB (Alternative)

If you prefer to run MongoDB locally:

### Step 1: Install Command Line Tools
```bash
sudo rm -rf /Library/Developer/CommandLineTools
sudo xcode-select --install
```

### Step 2: Install MongoDB
```bash
brew tap mongodb/brew
brew install mongodb-community@7.0
```

### Step 3: Start MongoDB Service
```bash
brew services start mongodb-community@7.0
```

### Step 4: Update Environment File
```env
MONGODB_URI=mongodb://localhost:27017/flyr-dashboard
```

## Testing the Connection

After setting up either option:

1. Run the seeding script:
```bash
pnpm run seed
```

2. Start the development server:
```bash
pnpm dev
```

3. Check the dashboard at `http://localhost:3000`

## Troubleshooting

### Connection Issues
- Verify your connection string is correct
- Check that your IP address is whitelisted (Atlas)
- Ensure MongoDB service is running (local)

### Authentication Issues
- Double-check username and password
- Verify database user has correct permissions

### Network Issues
- Check firewall settings
- Verify network access settings in Atlas

## Security Notes

- Never commit your `.env.local` file to version control
- Use environment variables in production
- Regularly rotate database passwords
- Use IP whitelisting in production 