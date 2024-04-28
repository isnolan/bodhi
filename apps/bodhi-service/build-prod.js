const fs = require('fs');
const packageJson = require('./package.json');

// 设置环境变量来指示生产环境
const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) {
  // 假设您想替换的依赖项
  const dependenciesToUpdate = {
    '@isnolan/bodhi-adapter': '^0.5.1', // 生产环境下您希望使用的版本
    '@isnolan/bodhi-puppet': '^1.0.0',
  };

  packageJson.dependencies = {
    ...packageJson.dependencies,
    ...dependenciesToUpdate,
  };

  // 写回修改后的package.json
  fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
}
