/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable, OnApplicationShutdown } from '@nestjs/common';
import * as Redis from 'ioredis';
import { IsNull, Not } from 'typeorm';
import type { AvatarDecorationsRepository, InstancesRepository, UsersRepository, MiAvatarDecoration, MiUser } from '@/models/_.js';
import { IdService } from '@/core/IdService.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { DI } from '@/di-symbols.js';
import { bindThis } from '@/decorators.js';
import { MemorySingleCache } from '@/misc/cache.js';
import type { GlobalEvents } from '@/core/GlobalEventService.js';
import { ModerationLogService } from '@/core/ModerationLogService.js';
import { HttpRequestService } from '@/core/HttpRequestService.js';
import { appendQuery, query } from '@/misc/prelude/url.js';
import type { Config } from '@/config.js';

// TODO:
// 1. checkDuplicateする => done
// 2. リモートのデコレーションをproxy通してないメディアURLで保存できるようにする => プロキシのURLだと403になるので必須
// 3. AvatarDecorationsEntityServiceを作ってpackする
// 4. リモートユーザーのデコレーションを適宜fetchできる関数とAPIを作る
// 5. remoteUserUpdateの処理をAPIfetchの部分とアップデートの部分に分ける => 4をやるためには必要
// 6. するか迷う: MiAvatarDecorationのカラムにdescriptionの他にライセンス欄を追加する
// 7. するか迷う: APubでデコレーションを配信する? => Misskey自体は今のところやることなさそうだからやるならnsを作る必要がある
// 8. avatar-decorationのjson-schemaを作る => packするためには必要
@Injectable()
export class AvatarDecorationService implements OnApplicationShutdown {
	public cache: MemorySingleCache<MiAvatarDecoration[]>;
	public cacheWithRemote: MemorySingleCache<MiAvatarDecoration[]>;

	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.redisForSub)
		private redisForSub: Redis.Redis,

		@Inject(DI.avatarDecorationsRepository)
		private avatarDecorationsRepository: AvatarDecorationsRepository,

		@Inject(DI.instancesRepository)
		private instancesRepository: InstancesRepository,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		private idService: IdService,
		private moderationLogService: ModerationLogService,
		private globalEventService: GlobalEventService,
		private httpRequestService: HttpRequestService,
	) {
		this.cache = new MemorySingleCache<MiAvatarDecoration[]>(1000 * 60 * 30); // 30s
		this.cacheWithRemote = new MemorySingleCache<MiAvatarDecoration[]>(1000 * 60 * 30); // 30s

		this.redisForSub.on('message', this.onMessage);
	}

	@bindThis
	private async onMessage(_: string, data: string): Promise<void> {
		const obj = JSON.parse(data);

		if (obj.channel === 'internal') {
			const { type, body } = obj.message as GlobalEvents['internal']['payload'];
			switch (type) {
				case 'avatarDecorationCreated':
				case 'avatarDecorationUpdated':
				case 'avatarDecorationDeleted': {
					this.cache.delete();
					break;
				}
				default:
					break;
			}
		}
	}

	@bindThis
	public async create(options: Partial<MiAvatarDecoration>, moderator?: MiUser): Promise<MiAvatarDecoration> {
		const created = await this.avatarDecorationsRepository.insertOne({
			id: this.idService.gen(),
			...options,
		});

		this.globalEventService.publishInternalEvent('avatarDecorationCreated', created);

		if (moderator) {
			this.moderationLogService.log(moderator, 'createAvatarDecoration', {
				avatarDecorationId: created.id,
				avatarDecoration: created,
			});
		}

		return created;
	}

	@bindThis
	public async update(id: MiAvatarDecoration['id'], params: Partial<MiAvatarDecoration>, moderator?: MiUser): Promise<void> {
		const avatarDecoration = await this.avatarDecorationsRepository.findOneByOrFail({ id });

		const date = new Date();
		await this.avatarDecorationsRepository.update(avatarDecoration.id, {
			updatedAt: date,
			...params,
		});

		const updated = await this.avatarDecorationsRepository.findOneByOrFail({ id: avatarDecoration.id });
		this.globalEventService.publishInternalEvent('avatarDecorationUpdated', updated);

		if (moderator) {
			this.moderationLogService.log(moderator, 'updateAvatarDecoration', {
				avatarDecorationId: avatarDecoration.id,
				before: avatarDecoration,
				after: updated,
			});
		}
	}

	@bindThis
	private getProxiedUrl(url: string, mode?: 'static' | 'avatar'): string {
		return appendQuery(
			`${this.config.mediaProxy}/${mode ?? 'image'}.webp`,
			query({
				url,
				...(mode ? { [mode]: '1' } : {}),
			}),
		);
	}

	@bindThis
	public async remoteUserUpdate(user: MiUser) {
		const userHost = user.host ?? '';
		const instance = await this.instancesRepository.findOneBy({ host: userHost });
		const userHostUrl = `https://${user.host}`;
		const showUserApiUrl = `${userHostUrl}/api/users/show`;

		if (!['misskey', 'cherrypick', 'sharkey'].includes(<string>instance?.softwareName)) return;

		const res = await this.httpRequestService.send(showUserApiUrl, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ 'username': user.username }),
		});

		const userData: any = await res.json();
		const userAvatarDecorations = userData.avatarDecorations ?? undefined;

		if (!userAvatarDecorations || userAvatarDecorations.length === 0) {
			const updates = {} as Partial<MiUser>;
			updates.avatarDecorations = [];
			await this.usersRepository.update({ id: user.id }, updates);
			return;
		}

		const instanceHost = instance!.host;
		const decorationApiUrl = `https://${instanceHost}/api/get-avatar-decorations`;
		const allRes = await this.httpRequestService.send(decorationApiUrl, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({}),
		});

		const allDecorations: any = await allRes.json();
		const updates = {} as Partial<MiUser>;
		updates.avatarDecorations = [];

		for (const avatarDecoration of userAvatarDecorations) {
			let name;
			let description;
			const avatarDecorationId = avatarDecoration.id;

			for (const decoration of allDecorations) {
				// eslint-disable-next-line eqeqeq
				if (decoration.id == avatarDecorationId) {
					name = decoration.name;
					description = decoration.description;
					break;
				}
			}

			const existingDecoration = await this.avatarDecorationsRepository.findOneBy({
				host: userHost,
				remoteId: avatarDecorationId,
			});

			const decorationData = {
				name: name,
				description: description,
				url: this.getProxiedUrl(avatarDecoration.url, 'avatar'),
				remoteId: avatarDecorationId,
				host: userHost,
				rawUrl: avatarDecoration.url,
			};

			if (existingDecoration == null) {
				await this.create(decorationData);
				this.cacheWithRemote.delete();
			} else {
				await this.update(existingDecoration.id, decorationData);
				this.cacheWithRemote.delete();
			}

			const findDecoration = await this.avatarDecorationsRepository.findOneBy({
				host: userHost,
				remoteId: avatarDecorationId,
			});

			updates.avatarDecorations.push({
				id: findDecoration?.id ?? '',
				angle: avatarDecoration.angle ?? 0,
				flipH: avatarDecoration.flipH ?? false,
				offsetX: avatarDecoration.offsetX ?? 0,
				offsetY: avatarDecoration.offsetY ?? 0,
				scale: avatarDecoration.scale ?? 1,
				opacity: avatarDecoration.opacity ?? 1,
			});
		}
		await this.usersRepository.update({ id: user.id }, updates);
	}

	@bindThis
	public async delete(id: MiAvatarDecoration['id'], moderator?: MiUser): Promise<void> {
		const avatarDecoration = await this.avatarDecorationsRepository.findOneByOrFail({ id });

		await this.avatarDecorationsRepository.delete({ id: avatarDecoration.id });
		this.globalEventService.publishInternalEvent('avatarDecorationDeleted', avatarDecoration);

		if (moderator) {
			this.moderationLogService.log(moderator, 'deleteAvatarDecoration', {
				avatarDecorationId: avatarDecoration.id,
				avatarDecoration: avatarDecoration,
			});
		}
	}

	@bindThis
	public async getAll(noCache = false, withRemote = false, remoteOnly = false): Promise<MiAvatarDecoration[]> {
		if (noCache) {
			this.cache.delete();
			this.cacheWithRemote.delete();
		}

		if (remoteOnly) {
			return this.cacheWithRemote.fetch(() => this.avatarDecorationsRepository.find({
				where: {
					host: Not(IsNull()),
				},
			}));
		} else if (withRemote) {
			return this.cacheWithRemote.fetch(() => this.avatarDecorationsRepository.find());
		} else {
			return this.cache.fetch(() => this.avatarDecorationsRepository.find({
				where: {
					host: IsNull(),
				},
			}));
		}
	}

	@bindThis
	private async fetchRemoteDecorations(id: string): Promise<string | null> {
		const decoration = await this.avatarDecorationsRepository.findOneBy({ id });
		if (decoration == null) return null;
		if (!decoration.host) return null;

		const instance = await this.instancesRepository.findOneBy({ host: decoration.host });
		if (!instance) return null;

		if (!['misskey', 'cherrypick', 'sharkey'].includes(<string>instance.softwareName)) {
			return null;
		}

		const decorationApiUrl = `https://${instance.host}/api/get-avatar-decorations`;

		try {
			const res = await this.httpRequestService.send(decorationApiUrl, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({}),
			});

			const allDecorations: any = await res.json();
			const remoteDecoration = allDecorations.find((d: any) => d.id === decoration.remoteId);

			if (remoteDecoration?.url) {
				return remoteDecoration.url;
			}
		} catch (e) {
			return null;
		}
		return null;
	}

	@bindThis
	public async getRawUrl(decoration: MiAvatarDecoration): Promise<string | null> {
		if (decoration.rawUrl) return decoration.rawUrl;

		const remoteUrl = await this.fetchRemoteDecorations(decoration.id);
		if (remoteUrl) {
			await this.update(decoration.id, { rawUrl: remoteUrl });
		}
		return remoteUrl;
	}

	@bindThis
	public checkDuplicate(url: string, name: string): Promise<boolean> {
		return this.avatarDecorationsRepository.exists({ where: { url, name, host: IsNull() } });
	}

	@bindThis
	public dispose(): void {
		this.redisForSub.off('message', this.onMessage);
	}

	@bindThis
	public onApplicationShutdown(signal?: string | undefined): void {
		this.dispose();
	}
}
