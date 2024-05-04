import { JwtStrategy } from './jwt.strategy';
import { ApiKeyStrategy } from './key.strategy';
import { LocalStrategy } from './local.strategy';

export default [LocalStrategy, JwtStrategy, ApiKeyStrategy];
