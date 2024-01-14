// 导出配置
export default () => {
  return {
    jwt: {
      secret: process.env.JWT_SECRET,
      expiresIn: '604800s',
    },

    database: {
      type: 'mysql',
      host: process.env.MYSQL_HOST,
      port: parseInt(process.env.MYSQL_PORT || '3306'),
      username: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
      autoLoadEntities: true,
      timezone: 'Z',
      synchronize: process.env.NODE_ENV == 'development', // only dev
      debug: false,
    },

    redis: { host: process.env.REDIS_HOST, port: process.env.REDIS_PORT || 6379 },

    mail: {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 465,
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },

    proxy: process.env.PROXY_AGENT,
  };
};
