import { LocalStrategy } from './local.strategy';
import { JwtStrategy } from './jwt.strategy';
import { ApiKeyStrategy } from './key.strategy';

export default [LocalStrategy, JwtStrategy, ApiKeyStrategy];
