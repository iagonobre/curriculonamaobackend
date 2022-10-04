import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PayloadUserDTO } from 'src/dtos/UserDTO';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private usersService: UsersService,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const permission = this.reflector.get<string>(
      'permissions',
      context.getHandler(),
    );

    const request: PayloadUserDTO = context.switchToHttp().getRequest();
    const user = await this.usersService.findOne(request.user.email);

    if (permission === 'ADMIN') {
      if (user.admin) {
        return true;
      }
    }

    return false;
  }
}
