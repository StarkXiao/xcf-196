import { Controller, Get, Body, Patch } from '@nestjs/common';
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
}
