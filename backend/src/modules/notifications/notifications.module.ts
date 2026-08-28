import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { EmailVerificationService } from './email-verification.service';

@Module({
  providers: [NotificationsService, EmailVerificationService],
  exports: [NotificationsService, EmailVerificationService],
})
export class NotificationsModule {}
