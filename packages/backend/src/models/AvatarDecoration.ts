/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Entity, PrimaryColumn, Index, Column, ManyToOne, JoinColumn } from 'typeorm';
import { id } from './util/id.js';

@Entity('avatar_decoration')
export class MiAvatarDecoration {
	@PrimaryColumn(id())
	public id: string;

	@Column('timestamp with time zone', {
		nullable: true,
	})
	public updatedAt: Date | null;

	@Column('varchar', {
		length: 1024,
	})
	public url: string;

	@Column('varchar', {
		length: 256,
	})
	public name: string;

	@Column('varchar', {
		length: 2048,
	})
	public description: string;

	// TODO: 定期ジョブで存在しなくなったロールIDを除去するようにする
	@Column('varchar', {
		array: true, length: 128, default: '{}',
	})
	public roleIdsThatCanBeUsedThisDecoration: string[];

	@Column('varchar', {
		length: 32, nullable: true,
	})
	public remoteId: string | null;

	@Column('varchar', {
		length: 128, nullable: true,
	})
	public host: string | null;

	@Column('text', {
		nullable: true,
	})
	public rawUrl: string | null;
}
