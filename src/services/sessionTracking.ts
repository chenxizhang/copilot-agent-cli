import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { ISessionTrackingService } from '../core/interfaces';

export class SessionTrackingService implements ISessionTrackingService {
  private readonly sessionFilePath: string;
  private readonly sessionId: string;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.sessionFilePath = path.join(os.tmpdir(), `copilot-session-${this.sessionId}`);
  }

  isFirstCommandInSession(): boolean {
    return !fs.existsSync(this.sessionFilePath);
  }

  markSessionStarted(): void {
    try {
      fs.writeFileSync(this.sessionFilePath, Date.now().toString(), 'utf8');
    } catch (error) {
      // Silent fail - session tracking is not critical
    }
  }

  private generateSessionId(): string {
    // Use process PID and start time to create a unique session ID
    return `${process.pid}-${process.hrtime.bigint()}`;
  }
}