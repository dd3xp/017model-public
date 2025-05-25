export {};

declare global {
  // eslint-disable-next-line no-var
  var verificationCodes: { [key: string]: { code: string; expires: number } };
}

if (!global.verificationCodes) {
  global.verificationCodes = {};
}

const verificationCodes = global.verificationCodes;
export default verificationCodes; 