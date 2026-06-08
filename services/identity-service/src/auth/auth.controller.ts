import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /api/v1/auth/register
   * Register a new user account.
   *
   * Request:  { "email": "user@example.com", "password": "securePass123", "firstName": "John", "lastName": "Doe" }
   * Response: { "id": "uuid", "email": "user@example.com", "firstName": "John", "lastName": "Doe", "role": "CUSTOMER" }
   */
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  /**
   * POST /api/v1/auth/login
   * Authenticate and receive JWT + refresh token.
   *
   * Request:  { "email": "user@example.com", "password": "securePass123" }
   * Response: { "accessToken": "jwt...", "refreshToken": "uuid", "expiresIn": 900 }
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
}
