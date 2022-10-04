import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Resume, User } from '@prisma/client';
import { AuthService } from './auth/auth.service';
import { JwtAuthGuard } from './auth/strategies/jwt-auth.guard';
import { LocalAuthGuard } from './auth/strategies/local-auth.guard';
import { Permissions } from './auth/strategies/permissions.decorator';
import { CvsService } from './cvs/cvs.service';
import {
  CreateCurriculumDTO,
  GenerateCurriculumDTO,
  ResponseGenerateCurriculumDTO,
} from './dtos/CurriculumDTO';
import { RefreshTokenDTO } from './dtos/RefreshTokenDTO';
import {
  ActivateUserDTO,
  CreateUserDTO,
  DeleteUserDTO,
  EditUserDTO,
  ListUsersDTO,
  PasswordUserDTO,
  PayloadUserDTO,
  ResetPasswordUserDTO,
  UserDTO,
} from './dtos/UserDTO';
import { UsersService } from './users/users.service';
import { editFileName, imageFileFilter } from './utils/multerTransformer';
import { diskStorage } from 'multer';
import { EmailConfirmationService } from './emailConfirmation/emailConfirmation.service';
import { EmailPasswordResetService } from './emailPasswordReset/emailPasswordReset.service';

@Controller()
export class AppController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly cvsService: CvsService,
    private readonly emailConfirmationService: EmailConfirmationService,
    private readonly emailPasswordResetService: EmailPasswordResetService,
  ) {}

  @UseGuards(LocalAuthGuard)
  @Post('/login')
  login(@Request() req): any {
    return this.authService.login(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Post('/profile')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './public/images',
        filename: editFileName,
      }),
      fileFilter: imageFileFilter,
    }),
  )
  async uploadPhoto(
    @UploadedFile() file: Express.Multer.File,
    @Request() req: PayloadUserDTO,
  ): Promise<Omit<User, 'password'>> {
    return this.usersService.uploadPhoto({
      fileName: file.filename,
      email: req.user.email,
    });
  }

  @Post('/user/recovery/activate')
  async recoveryPassword(
    @Body() recoveryBody: ResetPasswordUserDTO,
  ): Promise<Omit<User, 'password'>> {
    return this.emailPasswordResetService.checkTokenResetPasswordValidation(
      recoveryBody,
    );
  }

  @Post('/user/recovery')
  async getRecovery(@Body() recoveryBody: { email: string }) {
    return this.emailPasswordResetService.sendResetPasswordLink(
      recoveryBody.email,
    );
  }

  @Post('/user/activate')
  async activateUser(
    @Body() activateUser: ActivateUserDTO,
  ): Promise<Omit<User, 'password'>> {
    return this.emailConfirmationService.checkTokenEmailValidation(
      activateUser,
    );
  }

  @Post('/user')
  async createUser(
    @Body() createUser: CreateUserDTO,
  ): Promise<Omit<User, 'password'>> {
    return this.usersService.createUser(createUser);
  }

  @UseGuards(JwtAuthGuard)
  @Get('/user')
  getUser(@Request() req: PayloadUserDTO): Promise<Omit<User, 'password'>> {
    return this.usersService.findOneRequest(req.user.email);
  }

  @UseGuards(JwtAuthGuard)
  @Post('/user/edit/password')
  async editPassword(
    @Body() editPassword: PasswordUserDTO,
    @Request() req: PayloadUserDTO,
  ): Promise<Omit<User, 'password'>> {
    return this.usersService.editPassword(editPassword, req.user.email);
  }

  @UseGuards(JwtAuthGuard)
  @Put('/user/edit')
  async editUser(
    @Body() editUser: EditUserDTO,
    @Request() req: PayloadUserDTO,
  ): Promise<Omit<User, 'password'>> {
    return this.usersService.editUser(editUser, req.user.email);
  }

  @Post('/user/refresh')
  async refreshToken(
    @Body() refreshToken: RefreshTokenDTO,
  ): Promise<Omit<UserDTO, 'user'>> {
    return this.authService.validateRefreshToken(refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Post('/cv')
  async createCurriculum(
    @Body() createCurriculum: CreateCurriculumDTO,
    @Request() req: PayloadUserDTO,
  ): Promise<Resume> {
    return this.cvsService.createCurriculum(createCurriculum, req.user.email);
  }

  @UseGuards(JwtAuthGuard)
  @Get('/cv')
  async listCurriculum(@Request() req: PayloadUserDTO): Promise<Resume[]> {
    return this.cvsService.listCurriculum(req.user.email);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('/cv/:id')
  async deleteCurriculum(
    @Param() params: { id: number },
    @Request() req: PayloadUserDTO,
  ): Promise<Resume> {
    return this.cvsService.deleteCurriculum(params.id, req.user.email);
  }

  @UseGuards(JwtAuthGuard)
  @Post('/cv/download')
  async download(
    @Body() download: GenerateCurriculumDTO,
    @Request() req: PayloadUserDTO,
  ): Promise<ResponseGenerateCurriculumDTO> {
    return this.cvsService.generateFile(download, req.user.email);
  }

  @Permissions('ADMIN')
  @UseGuards(JwtAuthGuard)
  @Get('/user/list')
  async listUsers(): Promise<ListUsersDTO> {
    return this.usersService.findAllAndCount();
  }

  @UseGuards(JwtAuthGuard)
  @Delete('/user/:email')
  async deleteUser(
    @Param() params: DeleteUserDTO,
    @Request() req: PayloadUserDTO,
  ): Promise<Omit<User, 'password'> | undefined> {
    return this.usersService.deleteUser(params.email, req.user.email);
  }
}
