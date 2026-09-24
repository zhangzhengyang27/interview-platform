import OSS from "ali-oss";

export interface STSCredentials {
  AccessKeyId: string;
  AccessKeySecret: string;
  SecurityToken: string;
  Expiration: string;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`环境变量 ${name} 未配置，请在 .env.local 中设置`);
  }
  return value;
}

export async function assumeRole(): Promise<STSCredentials> {
  const sts = new OSS.STS({
    accessKeyId: requireEnv("OSS_ACCESS_KEY_ID"),
    accessKeySecret: requireEnv("OSS_ACCESS_KEY_SECRET"),
  });

  const result = await sts.assumeRole(
    requireEnv("OSS_ROLE_ARN"),
    "",
    3600,
    "interview-platform-upload"
  );

  return {
    AccessKeyId: result.credentials.AccessKeyId,
    AccessKeySecret: result.credentials.AccessKeySecret,
    SecurityToken: result.credentials.SecurityToken,
    Expiration: result.credentials.Expiration,
  };
}
