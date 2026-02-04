import COS from 'cos-js-sdk-v5';

// 初始化 COS 实例
export const getCOSInstance = () => {
  return new COS({
    // 必选参数
    getAuthorization: async (options, callback) => {
      try {
        // 异步获取临时密钥
        const response = await fetch('/api/cos-sts');
        const data = await response.json();

        if (!response.ok) {
           console.error('Failed to fetch credentials', data);
           callback(data.error || 'Failed to fetch credentials');
           return;
        }

        const credentials = data.credentials;
        if (!credentials) {
            callback('No credentials returned');
            return;
        }

        callback({
          TmpSecretId: credentials.tmpSecretId,
          TmpSecretKey: credentials.tmpSecretKey,
          SecurityToken: credentials.sessionToken,
          // 建议返回服务器时间作为签名的开始时间，避免用户浏览器本地时间偏差过大导致签名错误
          StartTime: data.startTime, // 时间戳，单位秒，如：1580000000
          ExpiredTime: data.expiredTime, // 时间戳，单位秒，如：1580000000
        });
      } catch (error) {
        console.error('Error fetching COS credentials:', error);
        // callback(error);
      }
    },
  });
};

// 获取文件完整访问路径
export const getCOSUrl = (key: string) => {
  const bucket = process.env.NEXT_PUBLIC_TENCENT_BUCKET;
  const region = process.env.NEXT_PUBLIC_TENCENT_REGION;
  const cdnHost = process.env.NEXT_PUBLIC_CDN_HOST;

  // 如果配置了 CDN 域名，优先使用 CDN
  if (cdnHost) {
    // 确保 cdnHost 不带末尾斜杠，key 不带开头斜杠 (或统一处理)
    const cleanHost = cdnHost.replace(/\/$/, '');
    const cleanKey = key.replace(/^\//, '');
    return `${cleanHost}/${cleanKey}`;
  }

  // 否则使用默认 COS 域名
  if (bucket && region) {
    return `https://${bucket}.cos.${region}.myqcloud.com/${key.replace(/^\//, '')}`;
  }

  return key;
};
