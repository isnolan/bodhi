// 导出配置
export default () => {
  return {
    jwt: {
      secret: '3vRk^ga52xVP$B2vYK$%r8a8hctLgbU0',
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
      // debug: true,
    },

    redis: { host: process.env.REDIS_HOST, port: process.env.REDIS_PORT || 6379 },

    proxy: process.env.PROXY_AGENT,
  };
};
