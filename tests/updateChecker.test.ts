import { UpdateCheckerService } from '../src/services/updateChecker';
import * as https from 'https';

// Mock https module
jest.mock('https');
const mockHttps = https as jest.Mocked<typeof https>;

// Mock console.log to test output
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();

describe('UpdateCheckerService', () => {
  let service: UpdateCheckerService;

  beforeEach(() => {
    service = new UpdateCheckerService();
    jest.clearAllMocks();
  });

  test('should detect when update is available', async () => {
    // Mock successful npm registry response
    const mockResponse = {
      on: jest.fn((event, callback) => {
        if (event === 'data') {
          callback(JSON.stringify({ 'dist-tags': { latest: '2.0.0' } }));
        } else if (event === 'end') {
          callback();
        }
      })
    };

    const mockRequest = {
      on: jest.fn(),
      destroy: jest.fn()
    };

    mockHttps.get.mockImplementation((url, options, callback) => {
      if (typeof options === 'function') {
        callback = options;
      }
      if (callback) {
        callback(mockResponse as any);
      }
      return mockRequest as any;
    });

    const result = await service.checkForUpdates();

    expect(result).toEqual({
      hasUpdate: true,
      currentVersion: '1.1.0',
      latestVersion: '2.0.0'
    });
  });

  test('should detect when no update is available', async () => {
    // Mock npm registry response with same version
    const mockResponse = {
      on: jest.fn((event, callback) => {
        if (event === 'data') {
          callback(JSON.stringify({ 'dist-tags': { latest: '1.1.0' } }));
        } else if (event === 'end') {
          callback();
        }
      })
    };

    const mockRequest = {
      on: jest.fn(),
      destroy: jest.fn()
    };

    mockHttps.get.mockImplementation((url, options, callback) => {
      if (typeof options === 'function') {
        callback = options;
      }
      if (callback) {
        callback(mockResponse as any);
      }
      return mockRequest as any;
    });

    const result = await service.checkForUpdates();

    expect(result).toEqual({
      hasUpdate: false,
      currentVersion: '1.1.0',
      latestVersion: '1.1.0'
    });
  });

  test('should handle network errors gracefully', async () => {
    const mockRequest = {
      on: jest.fn((event, callback) => {
        if (event === 'error') {
          callback(new Error('Network error'));
        }
      }),
      destroy: jest.fn()
    };

    mockHttps.get.mockImplementation(() => {
      return mockRequest as any;
    });

    const result = await service.checkForUpdates();

    expect(result).toBeNull();
  });

  test('should handle timeout gracefully', async () => {
    const mockRequest = {
      on: jest.fn((event, callback) => {
        if (event === 'timeout') {
          callback();
        }
      }),
      destroy: jest.fn()
    };

    mockHttps.get.mockImplementation(() => {
      return mockRequest as any;
    });

    const result = await service.checkForUpdates();

    expect(result).toBeNull();
    expect(mockRequest.destroy).toHaveBeenCalled();
  });

  test('should handle invalid JSON response gracefully', async () => {
    const mockResponse = {
      on: jest.fn((event, callback) => {
        if (event === 'data') {
          callback('invalid json');
        } else if (event === 'end') {
          callback();
        }
      })
    };

    const mockRequest = {
      on: jest.fn(),
      destroy: jest.fn()
    };

    mockHttps.get.mockImplementation((url, options, callback) => {
      if (typeof options === 'function') {
        callback = options;
      }
      if (callback) {
        callback(mockResponse as any);
      }
      return mockRequest as any;
    });

    const result = await service.checkForUpdates();

    expect(result).toBeNull();
  });

  test('should display update notification correctly', () => {
    // This test verifies the method exists and can be called without errors
    expect(() => service.displayUpdateNotification('1.1.0', '2.0.0')).not.toThrow();
  });

  test('should compare versions correctly', () => {
    // Access private method for testing
    const compareVersions = (service as any).compareVersions.bind(service);

    expect(compareVersions('1.0.0', '2.0.0')).toBe(-1);
    expect(compareVersions('2.0.0', '1.0.0')).toBe(1);
    expect(compareVersions('1.0.0', '1.0.0')).toBe(0);
    expect(compareVersions('1.0.0', '1.0.1')).toBe(-1);
    expect(compareVersions('1.1.0', '1.0.1')).toBe(1);
    expect(compareVersions('v1.0.0', '2.0.0')).toBe(-1);
  });
});