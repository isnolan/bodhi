import { Request } from 'express';

interface User {
  user_id: number;
  user_key_id?: number;
  session_id?: number;
}

export interface RequestWithUser extends Request {
  user: User;
}
