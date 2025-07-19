import axios from 'axios';
import fs from 'fs';
import path from 'path';

export class StravaTokenManager {
    private clientId: string;
    private clientSecret: string;
    private refreshToken: string;
    private accessToken: string;
    private expiresAt: number;

    constructor() {
        this.clientId = process.env.STRAVA_CLIENT_ID || '';
        this.clientSecret = process.env.STRAVA_CLIENT_SECRET || '';
        this.refreshToken = process.env.STRAVA_REFRESH_TOKEN || '';
        this.accessToken = process.env.STRAVA_ACCESS_TOKEN || '';
        
        // Try to determine expiry from token creation
        // Since we don't store expiry time, we'll be conservative and refresh on startup
        this.expiresAt = Date.now() - 1; // Force check on first use
    }

    async getValidAccessToken(): Promise<string> {
        // Always check token validity with Strava first
        if (this.accessToken && await this.isTokenValid()) {
            return this.accessToken;
        }

        console.error('🔄 Access token invalid or expired, refreshing...');
        return await this.refreshAccessToken();
    }

    private async isTokenValid(): Promise<boolean> {
        try {
            // Test the token with a lightweight API call
            await axios.get('https://www.strava.com/api/v3/athlete', {
                headers: { 'Authorization': `Bearer ${this.accessToken}` },
                timeout: 5000 // Quick timeout
            });
            
            console.error('✅ Current token is still valid');
            return true;
        } catch (error: any) {
            if (error.response && error.response.status === 401) {
                console.error('⚠️  Token is expired or invalid');
                return false;
            }
            
            // Network errors or other issues - assume token is valid
            console.error('⚠️  Unable to verify token, assuming valid:', error.message);
            return true;
        }
    }

    private async refreshAccessToken(): Promise<string> {
        try {
            console.error('🔄 Refreshing Strava access token...');
            
            const response = await axios.post('https://www.strava.com/oauth/token', {
                client_id: this.clientId,
                client_secret: this.clientSecret,
                refresh_token: this.refreshToken,
                grant_type: 'refresh_token'
            });

            const tokens = response.data;
            
            // Update stored tokens
            this.accessToken = tokens.access_token;
            this.refreshToken = tokens.refresh_token; // Strava gives new refresh token too
            this.expiresAt = tokens.expires_at * 1000; // Convert to milliseconds

            console.error(`✅ Token refreshed successfully, expires at: ${new Date(this.expiresAt).toLocaleString()}`);

            // Update .env file automatically
            await this.updateEnvFile(tokens.access_token, tokens.refresh_token);

            return this.accessToken;
        } catch (error: any) {
            console.error('❌ Failed to refresh token:', error.response?.data || error.message);
            
            if (error.response?.status === 400 && error.response?.data?.errors) {
                const errors = error.response.data.errors;
                if (errors.some((e: any) => e.code === 'invalid' && e.field === 'refresh_token')) {
                    throw new Error('Refresh token is invalid. You need to re-authorize the app by running: npm run build && node dist/auth-setup.js');
                }
            }
            
            throw new Error('Token refresh failed. You may need to re-authorize the app.');
        }
    }

    private async updateEnvFile(newAccessToken: string, newRefreshToken: string) {
        try {
            const envPath = path.join(process.cwd(), '.env');
            
            if (!fs.existsSync(envPath)) {
                console.error('⚠️  .env file not found, skipping automatic update');
                return;
            }

            let envContent = fs.readFileSync(envPath, 'utf8');
            
            // Update access token
            envContent = envContent.replace(
                /STRAVA_ACCESS_TOKEN=.*/,
                `STRAVA_ACCESS_TOKEN=${newAccessToken}`
            );
            
            // Update refresh token
            envContent = envContent.replace(
                /STRAVA_REFRESH_TOKEN=.*/,
                `STRAVA_REFRESH_TOKEN=${newRefreshToken}`
            );

            fs.writeFileSync(envPath, envContent);
            console.error('✅ .env file updated with new tokens');
            
            // Update environment variables in current process
            process.env.STRAVA_ACCESS_TOKEN = newAccessToken;
            process.env.STRAVA_REFRESH_TOKEN = newRefreshToken;
            
        } catch (error) {
            console.error('⚠️  Could not update .env file:', error);
            console.error('📋 Manual update needed:');
            console.error(`STRAVA_ACCESS_TOKEN=${newAccessToken}`);
            console.error(`STRAVA_REFRESH_TOKEN=${newRefreshToken}`);
        }
    }
}