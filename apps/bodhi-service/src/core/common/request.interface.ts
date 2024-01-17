import { Request } from 'express';

interface User {
  user_id: number;
  user_key_id?: number;
  user_session_id?: number;
}

export interface RequestWithUser extends Request {
  user: User;
}
