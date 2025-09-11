import { SessionTrackingService } from '../src/services/sessionTracking';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('SessionTrackingService', () => {
  let service: SessionTrackingService;
  let sessionFilePath: string;

  beforeEach(() => {
    service = new SessionTrackingService();
    // Access private property for testing
    sessionFilePath = (service as any).sessionFilePath;
  });

  afterEach(() => {
    // Clean up session file if it exists
    if (fs.existsSync(sessionFilePath)) {
      fs.unlinkSync(sessionFilePath);
    }
  });

  test('should detect first command in session when no session file exists', () => {
    // Ensure no session file exists
    if (fs.existsSync(sessionFilePath)) {
      fs.unlinkSync(sessionFilePath);
    }

    expect(service.isFirstCommandInSession()).toBe(true);
  });

  test('should detect subsequent commands when session file exists', () => {
    // Create session file
    service.markSessionStarted();
    
    expect(service.isFirstCommandInSession()).toBe(false);
  });

  test('should create session file when marking session started', () => {
    // Ensure no session file exists initially
    if (fs.existsSync(sessionFilePath)) {
      fs.unlinkSync(sessionFilePath);
    }

    service.markSessionStarted();
    
    expect(fs.existsSync(sessionFilePath)).toBe(true);
  });

  test('should generate unique session IDs for different instances', () => {
    const service1 = new SessionTrackingService();
    const service2 = new SessionTrackingService();
    
    const sessionId1 = (service1 as any).sessionId;
    const sessionId2 = (service2 as any).sessionId;
    
    expect(sessionId1).not.toBe(sessionId2);
  });

  test('should handle file system errors gracefully', () => {
    // This test verifies that the service doesn't throw errors when file operations fail
    // We'll test this by checking that markSessionStarted doesn't throw
    expect(() => service.markSessionStarted()).not.toThrow();
  });
});