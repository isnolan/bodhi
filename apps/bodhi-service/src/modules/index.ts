import { AuthModule } from './auth/auth.module';
import { ChatModule } from './chat/chat.module';
import { FilesModule } from './files/files.module';
import { ToolsModule } from './tools/tools.module';
import { GptsModule } from './gpts/gpts.module';
import { SupplierModule } from './supplier/supplier.module';
import { ProviderModule } from './provider/provider.module';
import { SubscriptionModule } from './subscription/subscription.module';

export default [
  AuthModule,
  ChatModule,
  FilesModule,
  ToolsModule,
  GptsModule,
  SupplierModule,
  ProviderModule,
  SubscriptionModule,
];
