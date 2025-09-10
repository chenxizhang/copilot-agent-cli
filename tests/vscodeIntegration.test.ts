import { VSCodeIntegrationService } from '../src/services/vscodeIntegration';

describe('VSCodeIntegrationService', () => {
  let service: VSCodeIntegrationService;

  beforeEach(() => {
    service = new VSCodeIntegrationService();
  });

  test('should detect environment correctly', () => {
    const envInfo = service.getEnvironmentInfo();
    
    expect(envInfo).toBeDefined();
    expect(typeof envInfo.isVSCode).toBe('boolean');
    expect(typeof envInfo.description).toBe('string');
    expect(Array.isArray(envInfo.flags)).toBe(true);
    
    if (envInfo.isVSCode) {
      expect(envInfo.description).toBe('VS Code terminal');
      expect(envInfo.flags).toEqual(['-r']);
    } else {
      expect(envInfo.description).toBe('External terminal');
      expect(envInfo.flags).toEqual(['-n', '--maximize']);
    }
  });

  test('should return consistent environment info', () => {
    const envInfo1 = service.getEnvironmentInfo();
    const envInfo2 = service.getEnvironmentInfo();
    
    expect(envInfo1.isVSCode).toBe(envInfo2.isVSCode);
    expect(envInfo1.description).toBe(envInfo2.description);
    expect(envInfo1.flags).toEqual(envInfo2.flags);
  });
});