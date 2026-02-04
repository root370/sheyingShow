import type { NextApiRequest, NextApiResponse } from 'next';
import STS from 'qcloud-cos-sts';

// 配置参数，建议从环境变量中读取
const config = {
  secretId: process.env.TENCENT_SECRET_ID,
  secretKey: process.env.TENCENT_SECRET_KEY,
  proxy: '',
  durationSeconds: 1800, // 密钥有效期，单位秒
  bucket: process.env.NEXT_PUBLIC_TENCENT_BUCKET || process.env.TENCENT_BUCKET,
  region: process.env.NEXT_PUBLIC_TENCENT_REGION || process.env.TENCENT_REGION,
  // 允许操作的路径前缀，这里允许操作所有文件
  // 生产环境建议根据用户 ID 限制路径，例如: `allowPrefix: ${userId}/*`
  allowPrefix: '*', 
  // 密钥的权限列表
  allowActions: [
    // 简单上传
    'name/cos:PutObject',
    'name/cos:PostObject',
    // 分片上传
    'name/cos:InitiateMultipartUpload',
    'name/cos:ListMultipartUploads',
    'name/cos:ListParts',
    'name/cos:UploadPart',
    'name/cos:CompleteMultipartUpload',
    // 简单下载
    // 'name/cos:GetObject',
  ],
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 检查环境变量是否配置
  if (!config.secretId || !config.secretKey || !config.bucket || !config.region) {
    console.error('Tencent Cloud COS environment variables are missing.');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const shortBucketName = config.bucket.split('-')[0];
  const appId = config.bucket.split('-')[1];

  const policy = {
    version: '2.0',
    statement: [
      {
        action: config.allowActions,
        effect: 'allow',
        principal: { qcs: ['*'] },
        resource: [
          `qcs::cos:${config.region}:uid/${appId}:${config.bucket}/${config.allowPrefix}`,
        ],
      },
    ],
  };

  STS.getCredential(
    {
      secretId: config.secretId,
      secretKey: config.secretKey,
      proxy: config.proxy,
      durationSeconds: config.durationSeconds,
      policy: policy,
    },
    (err, credential) => {
      if (err) {
        console.error('STS error:', err);
        return res.status(500).json({ error: 'Failed to get credentials' });
      }
      res.status(200).json(credential);
    }
  );
}
