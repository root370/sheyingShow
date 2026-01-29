module.exports = {
  apps: [
    {
      name: 'sheying-show',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
    },
  ],
};
