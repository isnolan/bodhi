import { Request } from 'express';

interface User {
  user_id: number;
  client_user_id?: string;
  session_id?: number;
}

export interface RequestWithUser extends Request {
  user: User;
}
