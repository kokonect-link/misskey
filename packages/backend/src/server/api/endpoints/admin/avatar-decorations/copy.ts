/*
 * SPDX-FileCopyrightText: noridev and cherrypick-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import type { AvatarDecorationsRepository } from '@/models/_.js';
import type { MiDriveFile } from '@/models/DriveFile.js';
import { IdService } from '@/core/IdService.js';
import { AvatarDecorationService } from '@/core/AvatarDecorationService.js';
import { DriveService } from '@/core/DriveService.js';
import { ApiError } from '@/server/api/error.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireRolePolicy: 'canManageAvatarDecorations',
	kind: 'write:admin:avatar-decorations',

	errors: {
		noSuchDecoration: {
			message: 'No such decoration.',
			code: 'NO_SUCH_DECORATION',
			id: 'c4079dca-0dbf-4794-b56d-aa8b90ab85b0',
		},
		duplicateName: {
			message: 'Duplicate name.',
			code: 'DUPLICATE_NAME',
			id: 'f7a3462c-4e6e-4069-8421-b9bd4f4c3975',
		},
	},

	res: {
		type: 'object',
		optional: false, nullable: false,
		properties: {
			id: {
				type: 'string',
				optional: false, nullable: false,
				format: 'id',
			},
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		decorationId: { type: 'string', format: 'misskey:id' },
	},
	required: ['decorationId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.avatarDecorationsRepository)
		private avatarDecorationsRepository: AvatarDecorationsRepository,

		private avatarDecorationService: AvatarDecorationService,
		private driveService: DriveService,
		private idService: IdService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const decoration = await this.avatarDecorationsRepository.findOneBy({ id: ps.decorationId });
			if (decoration == null) {
				throw new ApiError(meta.errors.noSuchDecoration);
			}

			let driveFile: MiDriveFile;

			const uploadUrl = decoration.rawUrl ?? await this.avatarDecorationService.getRawUrl(decoration);

			try {
				driveFile = await this.driveService.uploadFromUrl({ url: uploadUrl!, user: null, force: true });
			} catch (e) {
				throw new ApiError();
			}

			const isDuplicate = await this.avatarDecorationService.checkDuplicate(uploadUrl!, decoration.name);
			if (isDuplicate) {
				throw new ApiError(meta.errors.duplicateName);
			}

			const addedDecoration = await this.avatarDecorationService.create({
				name: decoration.name,
				description: decoration.description,
				url: driveFile.url,
			}, me);

			return addedDecoration;
		});
	}
}
