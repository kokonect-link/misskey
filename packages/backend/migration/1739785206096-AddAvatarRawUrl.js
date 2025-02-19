/*
 * SPDX-FileCopyrightText: marie and other Sharkey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class AddAvatarRawUrl1739785206096 {
    name = 'AddAvatarRawUrl1739785206096'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "avatar_decoration" ADD COLUMN "rawUrl" text NULL`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "avatar_decoration" DROP COLUMN "rawUrl"`);
    }
}
