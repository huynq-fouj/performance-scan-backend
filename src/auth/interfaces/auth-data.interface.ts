import { UserResponseDto } from '../../users/dto/user-response.dto';

export interface AuthData {
  accessToken: string;
  user: UserResponseDto;
}
