import { Injectable } from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { mockUser } from '../data/seed';

@Injectable()
export class UsersService {
  private user: User = { ...mockUser };

  findOne(): User {
    return this.user;
  }

  update(updateUserDto: UpdateUserDto): User {
    this.user = {
      ...this.user,
      ...updateUserDto,
      notifications: {
        ...this.user.notifications,
        ...(updateUserDto.notifications || {}),
      },
    };
    return this.user;
  }

  getAnniversaryInfo(): { daysTogether: number; nextAnniversary: number; anniversaryDate: string } {
    const anniversary = new Date(this.user.anniversary);
    const today = new Date();
    
    const daysTogether = Math.floor((today.getTime() - anniversary.getTime()) / (1000 * 60 * 60 * 24));
    
    let nextAnniversary = new Date(today.getFullYear(), anniversary.getMonth(), anniversary.getDate());
    if (nextAnniversary < today) {
      nextAnniversary = new Date(today.getFullYear() + 1, anniversary.getMonth(), anniversary.getDate());
    }
    const daysUntilNext = Math.ceil((nextAnniversary.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      daysTogether,
      nextAnniversary: daysUntilNext,
      anniversaryDate: this.user.anniversary,
    };
  }
}
