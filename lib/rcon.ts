import Rcon from 'rcon-srcds';

interface RconConfig {
    host: string;
    port: number;
    password: string;
    timeout?: number;
}

class RconService {
    private config: RconConfig;
    private rcon: Rcon | null = null;

    constructor(config: RconConfig) {
        this.config = {
            ...config,
            timeout: config.timeout || 5000,
        };
    }

    async connect(): Promise<void> {
        if (this.rcon) {
            return; // Already connected
        }

        this.rcon = new Rcon({
            host: this.config.host,
            port: this.config.port,
            timeout: this.config.timeout,
        });

        try {
            await this.rcon.authenticate(this.config.password);
            console.log(`[RCON] Connected to ${this.config.host}:${this.config.port}`);
        } catch (error) {
            console.error('[RCON] Authentication failed:', error);
            this.rcon = null;
            throw new Error('RCON authentication failed');
        }
    }

    async execute(command: string): Promise<string> {
        if (!this.rcon) {
            await this.connect();
        }

        try {
            const response = await this.rcon!.execute(command);
            console.log(`[RCON] Executed: ${command}`);
            // rcon-srcds returns string or boolean, normalize to string
            return typeof response === 'string' ? response : String(response);
        } catch (error) {
            console.error(`[RCON] Command failed: ${command}`, error);
            throw error;
        }
    }

    async disconnect(): Promise<void> {
        if (this.rcon) {
            this.rcon.disconnect();
            this.rcon = null;
            console.log('[RCON] Disconnected');
        }
    }

    // Convenience methods for common commands
    async changeMap(mapName: string): Promise<string> {
        return this.execute(`changelevel ${mapName}`);
    }

    async executeConfig(configName: string): Promise<string> {
        return this.execute(`exec ${configName}`);
    }

    async say(message: string): Promise<string> {
        return this.execute(`say ${message}`);
    }

    async kickPlayer(playerName: string, reason?: string): Promise<string> {
        const cmd = reason
            ? `sm_kick "${playerName}" "${reason}"`
            : `sm_kick "${playerName}"`;
        return this.execute(cmd);
    }
}

// Factory function to create RCON service for a game server
export function createRconService(
    host: string,
    port: number,
    password: string
): RconService {
    return new RconService({ host, port, password });
}

export default RconService;
