import { Controller, Get, Body, Patch, Param } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('api/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  findOne() {
    return this.usersService.findOne();
  }

  @Patch('profile')
  update(@Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(updateUserDto);
  }

  @Get('anniversary')
  getAnniversary() {
    return this.usersService.getAnniversaryInfo();
  }

  @Patch('atmosphere')
  applyAtmosphere(@Body() body: { type: 'romantic' | 'festive' | 'none' }) {
    return this.usersService.applyAtmosphere(body.type);
  }

  @Get('original-theme')
  getOriginalTheme() {
    return { theme: this.usersService.getOriginalTheme() };
  }
}
