import { ApiProperty } from '@nestjs/swagger';

import { Users } from '@/modules/users/entity/users.entity';

export class UserResponse {
  @ApiProperty()
  user_id: string;

  @ApiProperty()
  mobile: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  nickname: string;

  @ApiProperty()
  avatar: string;

  @ApiProperty()
  locale: string;

  @ApiProperty({ default: 1 })
  status: number;
}

export class AuthResponse {
  @ApiProperty({ type: UserResponse })
  profile: Users;

  @ApiProperty()
  abilities: string[];

  @ApiProperty()
  access_token?: string;
}
