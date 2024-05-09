import { AuthModule } from './auth/auth.module';
import { ChatModule } from './chat/chat.module';
import { FilesModule } from './files/files.module';
// import { ToolsModule } from './tools/tools.module';
// import { GptsModule } from './gpts/gpts.module';
import { ProviderModule } from './provider/provider.module';
import { SubscriptionModule } from './subscription/subscription.module';
import { SupplierModule } from './supplier/supplier.module';

export default [
  AuthModule,
  ChatModule,
  FilesModule,
  // ToolsModule,
  // GptsModule,
  SupplierModule,
  ProviderModule,
  SubscriptionModule,
];
