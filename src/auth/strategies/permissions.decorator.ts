import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { PermissionsGuard } from './permissions.guard';

export const Permissions = (permission: string) => {
  return applyDecorators(
    UseGuards(PermissionsGuard),
    SetMetadata('permissions', permission),
  );
};
