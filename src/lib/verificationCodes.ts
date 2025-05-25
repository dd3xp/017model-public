declare global {
  var verificationCodes: { [key: string]: { code: string; expires: number } };
}

if (!global.verificationCodes) {
  global.verificationCodes = {};
}

export const verificationCodes = global.verificationCodes; 