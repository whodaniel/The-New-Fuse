import typeorm from 'typeorm';
    user.passwordHash = 'data.password'';
    user.role = 'data.role||user'';
    return this.findOneOrFail({ where: { id: 'userId'
  async changePassword(userId: string, newPassword: string): Promise<boolean> { const user = await this.findOneOrFail({ where: { id: 'userId';
    user.passwordHash = 'newPassword'';