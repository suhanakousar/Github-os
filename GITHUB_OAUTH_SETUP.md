# GitHub OAuth Setup

To enable GitHub authentication and repository selection:

1. **Create a GitHub OAuth App:**
   - Go to https://github.com/settings/developers
   - Click "New OAuth App"
   - Application name: `GitMind OS`
   - Homepage URL: `http://localhost:3457`
   - Authorization callback URL: `http://localhost:3457/api/auth/github/callback`
   - Click "Register application"

2. **Add to .env file:**
   ```
   GITHUB_CLIENT_ID=your_client_id_here
   GITHUB_CLIENT_SECRET=your_client_secret_here
   GITHUB_CALLBACK_URL=http://localhost:3457/api/auth/github/callback
   SESSION_SECRET=your-random-secret-key-here
   ```

3. **Restart the server**

4. **Usage:**
   - Click "Select Repository" button
   - If not signed in, click "Sign in with GitHub"
   - Authorize the application
   - You'll see all your GitHub repositories
   - Select one to analyze

**Note:** The GitHub token is stored in your session and used to fetch repository data with proper permissions.

